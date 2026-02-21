const Question = require('../models/Question');
const { z } = require('zod');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const contributeSchema = z.object({
  text: z.string().min(5),
  answer: z.string().min(1),
  industry: z.enum(['general', 'marketing', 'it', 'finance']).default('general'),
  level: z.number().min(1).max(10).default(1)
});

exports.listQuestions = async (req, res, next) => {
  try {
    const { industry, level, approved } = req.query;
    const q = {};
    if (industry) q.industry = industry;
    if (level) q.level = Number(level);
    if (approved !== undefined) q.approved = approved === 'true';

    // Use aggregation to get random questions
    const items = await Question.aggregate([
      { $match: q },
      { $sample: { size: 10 } }
    ]);

    // Transform to match frontend expectations
    const transformedItems = items.map(item => ({
      id: item._id.toString(),
      _id: item._id,
      prompt: item.prompt || item.text || 'Question',
      question: item.question || item.prompt || item.text,
      choices: item.choices || (item.options ? item.options.map(opt => ({ text: opt, score: 5 })) : []),
      options: item.options || item.choices?.map(c => c.text) || [],
      type: item.type,
      domain: item.domain,
      level: item.level
    }));

    return successResponse(res, transformedItems);
  } catch (err) {
    console.error('Error listing questions:', err);
    return errorResponse(res, 'Failed to load questions', 500, err.message);
  }
};

exports.contribute = async (req, res, next) => {
  try {
    const data = contributeSchema.parse(req.body);
    const q = await Question.create({
      ...data,
      contributorId: req.user?._id,
      approved: false
    });
    return successResponse(res, q, "Question contributed successfully", 201);
  } catch (err) {
    console.error('Error contributing question:', err);
    return errorResponse(res, 'Failed to contribute question', 400, err.message);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const id = req.body.id;
    const q = await Question.findByIdAndUpdate(id, { approved: true }, { new: true });
    if (!q) return errorResponse(res, 'Question not found', 404);
    return successResponse(res, q, "Question approved");
  } catch (err) {
    console.error('Error approving question:', err);
    return errorResponse(res, 'Failed to approve question', 500, err.message);
  }
};

exports.pullNext = async (req, res, next) => {
  try {
    // simple selection: match industry first else fallback to general
    const { industry = 'general', level = 1 } = req.query;
    // Use aggregation for random selection
    const match1 = { industry, level: Number(level), approved: true };
    let docs = await Question.aggregate([{ $match: match1 }, { $sample: { size: 1 } }]);
    let q = docs[0];

    if (!q) {
      const match2 = { industry: 'general', level: Number(level), approved: true };
      docs = await Question.aggregate([{ $match: match2 }, { $sample: { size: 1 } }]);
      q = docs[0];
    }
    if (!q) return errorResponse(res, 'No questions available', 404);

    // Transform response
    const transformed = {
      id: q._id.toString(),
      _id: q._id,
      prompt: q.prompt || q.text || 'Question',
      question: q.question || q.prompt || q.text,
      choices: q.choices || (q.options ? q.options.map(opt => ({ text: opt, score: 5 })) : []),
      options: q.options || q.choices?.map(c => c.text) || [],
      type: q.type,
      domain: q.domain,
      level: q.level
    };

    return successResponse(res, transformed);
  } catch (err) {
    console.error('Error pulling next question:', err);
    return errorResponse(res, 'Failed to get next question', 500, err.message);
  }
};
