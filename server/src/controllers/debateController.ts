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
        .select(
          'topic status startTime endTime consensusReached winningStrategy summary'
        );

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
    const pythonProcess = spawn(
      'python3',
      [
        'main.py',
        '--topic',
        topic,
        '--debate-id',
        debateId,
        '--max-iterations',
        maxIterations.toString(),
        '--api-url',
        process.env.API_URL || 'http://localhost:3001/api',
      ],
      {
        cwd: agentsPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DEBATE_API_URL: process.env.API_URL || 'http://localhost:3001/api',
        },
      }
    );

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
          endTime: new Date(),
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
          endTime: new Date(),
        },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({ error: 'Debate session not found' });
      }

      res.json({
        message: 'Debate session stopped',
        session,
      });
    } catch (error) {
      console.error('Error stopping debate:', error);
      res.status(500).json({ error: 'Failed to stop debate session' });
    }
  }

  // Stream debate updates via Server-Sent Events
  static async streamDebateUpdates(req: Request, res: Response) {
    const debateId = req.params.id;

    if (!debateId) {
      return res.status(400).json({ error: 'Debate ID is required' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', debateId })}\n\n`);

    // Poll for updates every 500ms for more responsive streaming
    const pollInterval = setInterval(async () => {
      try {
        const session = await DebateSession.findById(debateId);
        if (!session) {
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'Session not found',
            })}\n\n`
          );
          clearInterval(pollInterval);
          res.end();
          return;
        }

        // Get latest agent outputs
        const latestOutputs = await AgentOutput.find({ debateId })
          .sort({ timestamp: -1 })
          .limit(1);

        if (latestOutputs.length > 0) {
          const latest = latestOutputs[0];
          res.write(
            `data: ${JSON.stringify({
              type: 'agent_output',
              agentName: latest.agentName,
              phase: latest.phase,
              content: latest.content,
              timestamp: latest.timestamp,
            })}\n\n`
          );
        }

        // Check if debate is complete
        if (session.status === 'completed' || session.status === 'failed') {
          res.write(
            `data: ${JSON.stringify({
              type: 'status_update',
              status: session.status,
              consensusReached: session.consensusReached,
              winningStrategy: session.winningStrategy,
            })}\n\n`
          );

          clearInterval(pollInterval);
          res.end();
        }
      } catch (error) {
        console.error('Error in streaming updates:', error);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'Internal server error',
          })}\n\n`
        );
        clearInterval(pollInterval);
        res.end();
      }
    }, 500);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval);
      res.end();
    });
  }

  // Get final report for download
  static async getDebateReport(req: Request, res: Response) {
    try {
      const debateId = new Types.ObjectId(req.params.id);
      const fullSession = await DebateRepository.getFullDebateSession(debateId);

      if (!fullSession) {
        return res.status(404).json({ error: 'Debate session not found' });
      }

      // Generate a formatted report
      let report = `AI BOARD OF DIRECTORS - DEBATE REPORT\n`;
      report += `${'='.repeat(60)}\n\n`;
      report += `Topic: ${fullSession.session.topic}\n`;
      report += `Date: ${new Date(
        fullSession.session.startTime
      ).toLocaleString()}\n`;
      report += `Status: ${fullSession.session.status}\n`;
      report += `Consensus Reached: ${
        fullSession.session.consensusReached ? 'Yes' : 'No'
      }\n`;

      if (fullSession.session.winningStrategy) {
        report += `Winning Strategy: ${fullSession.session.winningStrategy}\n`;
      }

      report += `\n${'='.repeat(60)}\n\n`;

      // Add agent outputs by phase
      const phases = [
        'research',
        'presentation',
        'embodiment',
        'adjustment',
        'debate',
        'voting',
        'final_report',
      ];

      for (const phase of phases) {
        const phaseOutputs = fullSession.agentOutputs.filter(
          (output) => output.phase === phase
        );
        if (phaseOutputs.length > 0) {
          report += `PHASE: ${phase.toUpperCase()}\n`;
          report += `${'-'.repeat(40)}\n\n`;

          for (const output of phaseOutputs) {
            report += `${output.agentName}:\n`;
            report += `${output.content}\n\n`;
            report += `${'.'.repeat(60)}\n\n`;
          }
        }
      }

      // Add debate exchanges
      if (fullSession.debateExchanges.length > 0) {
        report += `DEBATE EXCHANGES\n`;
        report += `${'-'.repeat(40)}\n\n`;

        for (const exchange of fullSession.debateExchanges) {
          report += `Round ${exchange.roundNumber}: ${exchange.questioner} → ${exchange.responder}\n`;
          report += `Question: ${exchange.question}\n`;
          report += `Response: ${exchange.response}\n\n`;
          report += `${'.'.repeat(60)}\n\n`;
        }
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="debate_report_${debateId}.txt"`
      );
      res.send(report);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
}
