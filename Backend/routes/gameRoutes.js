const express = require("express");
const { getQuestions, submitGame } = require("../controllers/gameController");
const { auth } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Core game logic and submission
 */

/**
 * @swagger
 * /game/questions:
 *   get:
 *     summary: Retrieve all game questions
 *     tags: [Game]
 *     responses:
 *       200:
 *         description: List of questions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResp'
 */
router.get("/questions", auth(false), getQuestions); // Auth optional but good for personalization

/**
 * @swagger
 * /game/submit:
 *   post:
 *     summary: Submit game results
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *               - timeTaken
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               timeTaken:
 *                 type: number
 *               tabSwitches:
 *                 type: integer
 *               copyPasteEvents:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Game submitted/Score calculated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResp'
 */
router.post("/submit", auth(true), submitGame); // Auth required

module.exports = router;
