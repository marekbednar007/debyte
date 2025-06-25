import express from 'express';
import {
  DebateSession,
  AgentOutput,
  DebateExchange,
  DebateRepository,
} from '../models/debateModel';
import { AgentType, DebatePhase } from '../types/types';
import { DebateController } from '../controllers/debateController';
import { Types } from 'mongoose';

const router = express.Router();

// ===== MAIN DEBATE ENDPOINTS (Frontend Integration) =====

// Start a new debate session (Primary endpoint for frontend)
router.post('/debates/start', DebateController.startDebate);

// Get debate status and results (Primary endpoint for frontend)
router.get('/debates/:id/status', DebateController.getDebateStatus);

// Get all debates (Primary endpoint for frontend)
router.get('/debates', DebateController.getAllDebates);

// Stop a running debate
router.post('/debates/:id/stop', DebateController.stopDebate);

// Get debate statistics (Primary endpoint for frontend)
router.get('/debates/stats', DebateController.getDebateStats);

// ===== LOW-LEVEL DATABASE ENDPOINTS (Python Agent Integration) =====

// Create a new debate session (Direct API for Python)
router.post('/debates/create', async (req, res) => {
  try {
    const { topic, sessionFolder, participatingAgents } = req.body;

    if (!topic || !sessionFolder) {
      return res
        .status(400)
        .json({ error: 'Topic and sessionFolder are required' });
    }

    const session = await DebateRepository.createDebateSession(
      topic,
      sessionFolder
    );
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating debate session:', error);
    res.status(500).json({ error: 'Failed to create debate session' });
  }
});

// Get a debate session
router.get('/debates/:id', async (req, res) => {
  try {
    const debateId = new Types.ObjectId(req.params.id);
    const fullSession = await DebateRepository.getFullDebateSession(debateId);

    if (!fullSession) {
      return res.status(404).json({ error: 'Debate session not found' });
    }

    res.json(fullSession);
  } catch (error) {
    console.error('Error fetching debate session:', error);
    res.status(500).json({ error: 'Failed to fetch debate session' });
  }
});

// Update debate session
router.patch('/debates/:id', async (req, res) => {
  try {
    const debateId = new Types.ObjectId(req.params.id);
    const updates = req.body;

    const session = await DebateSession.findByIdAndUpdate(debateId, updates, {
      new: true,
    });

    if (!session) {
      return res.status(404).json({ error: 'Debate session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error updating debate session:', error);
    res.status(500).json({ error: 'Failed to update debate session' });
  }
});

// Complete a debate session
router.put('/debates/:id/complete', async (req, res) => {
  try {
    const debateId = new Types.ObjectId(req.params.id);
    const { votingResults, consensusAnalysis, finalReport } = req.body;

    const session = await DebateRepository.completeDebateSession(
      debateId,
      votingResults,
      consensusAnalysis,
      finalReport
    );

    if (!session) {
      return res.status(404).json({ error: 'Debate session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error completing debate session:', error);
    res.status(500).json({ error: 'Failed to complete debate session' });
  }
});

// Save agent output
router.post('/agent-outputs', async (req, res) => {
  try {
    const { debateId, agentName, phase, roundNumber, content, metadata } =
      req.body;

    if (
      !debateId ||
      !agentName ||
      !phase ||
      roundNumber === undefined ||
      !content
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const agentOutput = await DebateRepository.saveAgentOutput(
      new Types.ObjectId(debateId),
      agentName as AgentType,
      phase as DebatePhase,
      roundNumber,
      content,
      metadata
    );

    res.status(201).json(agentOutput);
  } catch (error) {
    console.error('Error saving agent output:', error);
    res.status(500).json({ error: 'Failed to save agent output' });
  }
});

// Save debate exchange
router.post('/debate-exchanges', async (req, res) => {
  try {
    const { debateId, roundNumber, questioner, responder, question, response } =
      req.body;

    if (
      !debateId ||
      roundNumber === undefined ||
      !questioner ||
      !responder ||
      !question ||
      !response
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const exchange = await DebateRepository.saveDebateExchange(
      new Types.ObjectId(debateId),
      roundNumber,
      questioner as AgentType,
      responder as AgentType,
      question,
      response
    );

    res.status(201).json(exchange);
  } catch (error) {
    console.error('Error saving debate exchange:', error);
    res.status(500).json({ error: 'Failed to save debate exchange' });
  }
});

export default router;
