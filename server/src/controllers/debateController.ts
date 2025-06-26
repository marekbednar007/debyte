import { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';
import {
  DebateSession,
  AgentOutput,
  DebateExchange,
  DebateRepository,
} from '../models/debateModel';
import { AgentType, DebatePhase } from '../types/types';
import { Types } from 'mongoose';

export class DebateController {
  // Track running debate processes to prevent multiple spawns
  private static runningProcesses = new Map<string, ChildProcess>();

  // Event emitter for real-time streaming
  private static debateEventEmitter = new EventEmitter();

  // Track SSE connections
  private static sseConnections = new Map<string, Response[]>();
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

      const debateId = String(session._id);

      // Check if a process is already running for this debate
      if (DebateController.runningProcesses.has(debateId)) {
        console.log(`⚠️ Debate process already running for ID: ${debateId}`);
        return res.status(409).json({
          error: 'Debate process already running for this session',
          session,
          status: 'running',
        });
      }

      // Check if session is already completed or failed
      if (session.status === 'completed' || session.status === 'failed') {
        console.log(`⚠️ Debate session ${debateId} already ${session.status}`);
        return res.status(409).json({
          error: `Debate session already ${session.status}`,
          session,
          status: session.status,
        });
      }

      console.log(`🚀 Starting new debate process for ID: ${debateId}`);

      // Start Python debate process
      const pythonProcess = DebateController.startPythonDebate(
        debateId,
        topic,
        maxIterations
      );

      // Track the running process
      DebateController.runningProcesses.set(debateId, pythonProcess);

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

    console.log(`🤖 Spawning Python process for debate ${debateId}`);

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
      const output = data.toString().trim();
      console.log(`[Python ${debateId}] ${output}`);

      // Parse Python output for agent status updates
      DebateController.parseAndEmitAgentUpdate(debateId, output);
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      console.error(`[Python ${debateId} Error] ${output}`);

      // Also check stderr for agent updates (some logging goes to stderr)
      DebateController.parseAndEmitAgentUpdate(debateId, output);
    });

    pythonProcess.on('close', async (code) => {
      console.log(`[Python ${debateId}] Process exited with code ${code}`);

      // Remove from running processes
      DebateController.runningProcesses.delete(debateId);

      // Emit completion event
      DebateController.emitToSSE(debateId, {
        type: 'session_update',
        data: {
          status: code === 0 ? 'completed' : 'failed',
          completed: true,
        },
        timestamp: new Date().toISOString(),
      });

      // Update debate session status
      try {
        await DebateSession.findByIdAndUpdate(debateId, {
          status: code === 0 ? 'completed' : 'failed',
          endTime: new Date(),
        });
        console.log(
          `✅ Updated debate ${debateId} status to ${
            code === 0 ? 'completed' : 'failed'
          }`
        );
      } catch (error) {
        console.error(
          `❌ Failed to update debate session ${debateId} status:`,
          error
        );
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`[Python ${debateId}] Failed to start process:`, error);
      // Remove from running processes on error
      DebateController.runningProcesses.delete(debateId);

      // Emit error event
      DebateController.emitToSSE(debateId, {
        type: 'error',
        data: {
          message: 'Failed to start debate process',
        },
        timestamp: new Date().toISOString(),
      });
    });

    return pythonProcess;
  }

  // Parse Python output and emit agent updates
  private static parseAndEmitAgentUpdate(debateId: string, output: string) {
    try {
      // Look for agent status indicators in the output
      if (
        output.includes('researching...') ||
        output.includes('⏱️  Starting research for')
      ) {
        const agentMatch = output.match(/→ (.+?) researching\.\.\./);
        if (agentMatch) {
          const agentName = agentMatch[1].trim();
          DebateController.emitToSSE(debateId, {
            type: 'agent_status',
            agent: agentName,
            data: {
              status: 'researching',
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Look for task completion
      if (
        output.includes('Task completed') ||
        output.includes('Agent completed')
      ) {
        // This would need more specific parsing based on your Python output format
        // For now, we'll rely on database polling for completed outputs
      }

      // Look for phase changes
      if (output.includes('Phase')) {
        const phaseMatch = output.match(/Phase (\d+): (.+)/);
        if (phaseMatch) {
          DebateController.emitToSSE(debateId, {
            type: 'session_update',
            data: {
              currentPhase: phaseMatch[2],
              currentIteration: parseInt(phaseMatch[1]),
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error parsing Python output:', error);
    }
  }

  // Emit event to all SSE connections for a debate
  private static emitToSSE(debateId: string, eventData: any) {
    const connections = DebateController.sseConnections.get(debateId) || [];
    const dataString = `data: ${JSON.stringify(eventData)}\n\n`;

    connections.forEach((res, index) => {
      try {
        res.write(dataString);
      } catch (error) {
        console.error(`Error writing to SSE connection ${index}:`, error);
        // Remove failed connection
        connections.splice(index, 1);
      }
    });

    // Update connections list
    if (connections.length > 0) {
      DebateController.sseConnections.set(debateId, connections);
    } else {
      DebateController.sseConnections.delete(debateId);
    }
  }

  // Stop a running debate
  static async stopDebate(req: Request, res: Response) {
    try {
      const debateId = req.params.id;

      // Kill the running Python process if it exists
      const runningProcess = DebateController.runningProcesses.get(debateId);
      if (runningProcess && !runningProcess.killed) {
        console.log(`🛑 Terminating Python process for debate ${debateId}`);
        runningProcess.kill('SIGTERM');
        DebateController.runningProcesses.delete(debateId);
      }

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

    console.log(`📡 SSE connection established for debate ${debateId}`);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Add this connection to the debate's SSE connections
    const connections = DebateController.sseConnections.get(debateId) || [];
    connections.push(res);
    DebateController.sseConnections.set(debateId, connections);

    // Send initial connection confirmation
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        debateId,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Send current session state
    try {
      const session = await DebateSession.findById(debateId);
      if (session) {
        res.write(
          `data: ${JSON.stringify({
            type: 'session_update',
            data: {
              status: session.status,
              currentIteration: session.currentIteration,
              maxIterations: session.maxIterations,
              topic: session.topic,
            },
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // Send existing agent outputs
        const existingOutputs = await AgentOutput.find({ debateId }).sort({
          timestamp: 1,
        });

        for (const output of existingOutputs) {
          res.write(
            `data: ${JSON.stringify({
              type: 'agent_output',
              agent: output.agentName,
              data: {
                content: output.content,
                phase: output.phase,
                roundNumber: output.roundNumber,
              },
              timestamp: output.timestamp,
            })}\n\n`
          );
        }
      }
    } catch (error) {
      console.error('Error sending initial state:', error);
    }

    // Set up periodic database polling for agent outputs (as backup)
    const pollInterval = setInterval(async () => {
      try {
        // Check for new agent outputs since last poll
        const recentOutputs = await AgentOutput.find({
          debateId,
          timestamp: { $gte: new Date(Date.now() - 2000) }, // Last 2 seconds
        }).sort({ timestamp: -1 });

        for (const output of recentOutputs) {
          res.write(
            `data: ${JSON.stringify({
              type: 'agent_output',
              agent: output.agentName,
              data: {
                content: output.content,
                phase: output.phase,
                roundNumber: output.roundNumber,
              },
              timestamp: output.timestamp,
            })}\n\n`
          );
        }

        // Check session status
        const session = await DebateSession.findById(debateId);
        if (
          session &&
          (session.status === 'completed' || session.status === 'failed')
        ) {
          res.write(
            `data: ${JSON.stringify({
              type: 'session_update',
              data: {
                status: session.status,
                completed: true,
                consensusReached: session.consensusReached,
                winningStrategy: session.winningStrategy,
              },
              timestamp: new Date().toISOString(),
            })}\n\n`
          );

          clearInterval(pollInterval);
          // Don't end the connection immediately, let client handle it
        }
      } catch (error) {
        console.error('Error in polling updates:', error);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            data: {
              message: 'Error fetching updates',
            },
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      }
    }, 1000); // Poll every second as backup

    // Clean up on client disconnect
    req.on('close', () => {
      console.log(`📡 SSE connection closed for debate ${debateId}`);
      clearInterval(pollInterval);

      // Remove this connection from the list
      const connections = DebateController.sseConnections.get(debateId) || [];
      const index = connections.indexOf(res);
      if (index > -1) {
        connections.splice(index, 1);
        if (connections.length > 0) {
          DebateController.sseConnections.set(debateId, connections);
        } else {
          DebateController.sseConnections.delete(debateId);
        }
      }

      res.end();
    });

    req.on('error', (error) => {
      console.error(`SSE connection error for debate ${debateId}:`, error);
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

  // Get running process status (for debugging)
  static getRunningProcesses() {
    return Array.from(DebateController.runningProcesses.keys());
  }

  // Clean up orphaned processes on server startup
  static async cleanupOrphanedProcesses() {
    try {
      console.log('🧹 Cleaning up orphaned debate processes...');

      // Find all "running" sessions in the database
      const runningSessions = await DebateSession.find({ status: 'running' });

      for (const session of runningSessions) {
        const debateId = String(session._id);

        // If no process is tracked for this session, mark it as failed
        if (!DebateController.runningProcesses.has(debateId)) {
          console.log(`🔄 Marking orphaned session ${debateId} as failed`);
          await DebateSession.findByIdAndUpdate(debateId, {
            status: 'failed',
            endTime: new Date(),
          });
        }
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}
