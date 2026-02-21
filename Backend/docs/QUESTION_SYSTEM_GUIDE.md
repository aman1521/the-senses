# Quick Reference: Question System

## Running the Question Pre-Generator

### Option 1: Via Script (Recommended)

```bash
cd Backend
node scripts/pregenerateQuestions.js
```

This will:

- Generate 200 questions per job profile per difficulty level
- Save them to the database
- Display progress and results
- Take about 5-10 minutes

### Option 2: Via API Endpoint

```bash
POST http://localhost:5000/api/questions/pregenerate
```

## Checking Question Stats

```bash
GET http://localhost:5000/api/questions/stats/:profileId
```

Example response:

```json
{
  "success": true,
  "stats": [
    { "_id": "easy", "count": 200, "avgUsage": 2.5, "aiGenerated": 180, "flagged": 0 },
    { "_id": "medium", "count": 200, "avgUsage": 3.1, "aiGenerated": 185, "flagged": 0 },
    { "_id": "hard", "count": 200, "avgUsage": 1.8, "aiGenerated": 190, "flagged": 0 }
  ]
}
```

## Generating Questions for a Test

```bash
POST http://localhost:5000/api/questions/generate
Content-Type: application/json

{
  "profileId": "software-engineer",
  "difficulty": "medium",
  "count": 30
}
```

## Flagging a Bad Question

If a user reports a question as inappropriate:

```bash
POST http://localhost:5000/api/questions/flag
Content-Type: application/json

{
  "questionId": "507f1f77bcf86cd799439011",
  "reason": "Options are too similar and confusing"
}
```

## Clearing Cache

If you've made changes to questions and want to clear the cache:

```bash
POST http://localhost:5000/api/questions/cache/clear
```

## Question Quality Metrics

The system tracks:

- **usageCount**: How many times a question has been used
- **correctAnswerRate**: Percentage of users who answer correctly
- **averageTimeToAnswer**: Average time spent on the question
- **flagged**: Whether the question has been reported

## Best Practices

1. **Pre-generate regularly**: Run the script weekly to keep fresh questions
2. **Monitor flagged questions**: Review and fix/remove bad questions
3. **Check stats**: Ensure each profile has at least 150-200 questions per difficulty
4. **User history**: The system automatically avoids showing users the same questions

## Files to Know

- **QuestionBank Model**: `Backend/models/QuestionBank.js`
- **Question Generator**: `Backend/ai-agents/questions/questionGenerator.js`
- **Question Service**: `Backend/services/questionService.js`
- **API Routes**: `Backend/routes/questionRoutes.js`
- **Pre-gen Script**: `Backend/scripts/pregenerateQuestions.js`

## Troubleshooting

**"Not enough unique questions"**:

- Run the pre-generation script
- Check if AI API key is configured
- Fallback templates will be used if AI fails

**"Questions repeating"**:

- Ensure user is logged in (tracking requires userId)
- Check that question pool is > 50 questions
- Run pre-generation to add more questions

**"Irrelevant options showing"**:

- This should be fixed with the new contextual distractor system
- If it persists, flag the question for review
- Check that the question is AI-generated (better quality)
