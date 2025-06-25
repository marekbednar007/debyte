import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import {
  DebateSession,
  AgentOutput,
  DebateExchange,
  DebateRepository,
} from '../models/debateModel';
import { AgentType, DebatePhase } from '../types/types';
import { Types } from 'mongoose';

export class DebateController {
  // Start a new debate session
  static async startDebate(req: Request, res: Response) {
    try {
      const { topic, maxIterations = 3 } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      // Create debate session in MongoDB
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanTopic = topic.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
      const sessionFolder = `${timestamp}_${cleanTopic.replace(/\s+/g, '_')}`;

      const session = await DebateRepository.createDebateSession(
        topic,
        sessionFolder
      );

      // Start Python debate process
      const pythonProcess = DebateController.startPythonDebate(
        String(session._id),
        topic,
        maxIterations
      );

      res.status(201).json({
        message: 'Debate session started',
        session,
        status: 'running',
      });
    } catch (error) {
      console.error('Error starting debate:', error);
      res.status(500).json({ error: 'Failed to start debate session' });
    }
  }

  // Get debate status and results
  static async getDebateStatus(req: Request, res: Response) {
    try {
      const debateId = new Types.ObjectId(req.params.id);
      const fullSession = await DebateRepository.getFullDebateSession(debateId);

      if (!fullSession) {
        return res.status(404).json({ error: 'Debate session not found' });
      }

      res.json({
        session: fullSession.session,
        agentOutputs: fullSession.agentOutputs,
        debateExchanges: fullSession.debateExchanges,
        status: fullSession.session.status,
      });
    } catch (error) {
      console.error('Error fetching debate status:', error);
      res.status(500).json({ error: 'Failed to fetch debate status' });
    }
  }

  // Get all debates with pagination
  static async getAllDebates(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const skip = (page - 1) * limit;
      let query: any = {};

      if (status) {
        query.status = status;
      }

      const sessions = await DebateSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('topic status startTime endTime consensusReached winningStrategy summary');

      const total = await DebateSession.countDocuments(query);

      res.json({
        debates: sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching debates:', error);
      res.status(500).json({ error: 'Failed to fetch debates' });
    }
  }

  // Get debate statistics
  static async getDebateStats(req: Request, res: Response) {
    try {
      const stats = await DebateRepository.getDebateStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch debate statistics' });
    }
  }

  // Private method to start Python debate process
  private static startPythonDebate(
    debateId: string,
    topic: string,
    maxIterations: number
  ) {
    const agentsPath = path.join(__dirname, '../../../agents');
    
    // Create the Python command
    const pythonProcess = spawn('python3', [
      'main.py',
      '--topic', topic,
      '--debate-id', debateId,
      '--max-iterations', maxIterations.toString(),
      '--api-url', process.env.API_URL || 'http://localhost:4000/api'
    ], {
      cwd: agentsPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DEBATE_API_URL: process.env.API_URL || 'http://localhost:4000/api'
      }
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python Agents] ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python Agents Error] ${data.toString()}`);
    });

    pythonProcess.on('close', async (code) => {
      console.log(`[Python Agents] Process exited with code ${code}`);
      
      // Update debate session status
      try {
        await DebateSession.findByIdAndUpdate(debateId, {
          status: code === 0 ? 'completed' : 'failed',
          endTime: new Date()
        });
      } catch (error) {
        console.error('Failed to update debate session status:', error);
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`[Python Agents] Failed to start process:`, error);
    });

    return pythonProcess;
  }

  // Stop a running debate
  static async stopDebate(req: Request, res: Response) {
    try {
      const debateId = new Types.ObjectId(req.params.id);
      
      // Update session to stopped status
      const session = await DebateSession.findByIdAndUpdate(
        debateId,
        { 
          status: 'failed',
          endTime: new Date()
        },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({ error: 'Debate session not found' });
      }

      res.json({
        message: 'Debate session stopped',
        session
      });
    } catch (error) {
      console.error('Error stopping debate:', error);
      res.status(500).json({ error: 'Failed to stop debate session' });
    }
  }
}
