import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  DebatePhase,
  AgentType,
  IVotingResult,
  IConsensusResult,
} from '../types/types';

// Interface for individual agent output documents
export interface IAgentOutput extends Document {
  debateId: Types.ObjectId;
  agentName: AgentType;
  phase: DebatePhase;
  roundNumber: number;
  content: string;
  wordCount: number;
  timestamp: Date;
  metadata?: {
    questionTo?: string;
    responseFrom?: string;
    votedFor?: string;
    [key: string]: any;
  };
}

// Interface for debate exchange documents
export interface IDebateExchange extends Document {
  debateId: Types.ObjectId;
  roundNumber: number;
  questioner: AgentType;
  responder: AgentType;
  question: string;
  response: string;
  timestamp: Date;
  wordCounts: {
    question: number;
    response: number;
  };
}

// Main debate session interface
export interface IDebateSession extends Document {
  topic: string;
  status: 'active' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes

  // Configuration
  maxIterations: number;
  currentIteration: number;
  currentPhase: DebatePhase;

  // Participants
  participatingAgents: AgentType[];

  // High-level results
  consensusReached: boolean;
  winningStrategy?: AgentType;

  // Summary metrics
  summary: {
    totalAgentOutputs: number;
    totalDebateExchanges: number;
    totalWordCount: number;
    phaseCompletionTimes: Map<DebatePhase, Date>;
    iterationsCompleted: number;
  };

  // Final outputs (stored directly for quick access)
  finalReport?: {
    content: string;
    wordCount: number;
    generatedAt: Date;
    collaborativelyApproved: boolean;
  };

  // Voting and consensus
  votingResults?: IVotingResult[];
  consensusAnalysis?: IConsensusResult;

  // File system references
  sessionFolder: string;
  fileReferences: {
    [agentName: string]: {
      research?: string;
      adjustment?: string;
      voting?: string;
      [phase: string]: string | undefined;
    };
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string; // System version used
}

// Schemas
const AgentOutputSchema = new Schema<IAgentOutput>(
  {
    debateId: {
      type: Schema.Types.ObjectId,
      ref: 'DebateSession',
      required: true,
      index: true,
    },
    agentName: { type: String, enum: Object.values(AgentType), required: true },
    phase: { type: String, enum: Object.values(DebatePhase), required: true },
    roundNumber: { type: Number, required: true },
    content: { type: String, required: true },
    wordCount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'agent_outputs',
  }
);

const DebateExchangeSchema = new Schema<IDebateExchange>(
  {
    debateId: {
      type: Schema.Types.ObjectId,
      ref: 'DebateSession',
      required: true,
      index: true,
    },
    roundNumber: { type: Number, required: true },
    questioner: {
      type: String,
      enum: Object.values(AgentType),
      required: true,
    },
    responder: { type: String, enum: Object.values(AgentType), required: true },
    question: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    wordCounts: {
      question: { type: Number, required: true },
      response: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'debate_exchanges',
  }
);

const DebateSessionSchema = new Schema<IDebateSession>(
  {
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active',
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number }, // in minutes

    maxIterations: { type: Number, default: 3 },
    currentIteration: { type: Number, default: 1 },
    currentPhase: {
      type: String,
      enum: Object.values(DebatePhase),
      default: DebatePhase.RESEARCH,
    },

    participatingAgents: [{ type: String, enum: Object.values(AgentType) }],

    consensusReached: { type: Boolean, default: false },
    winningStrategy: { type: String, enum: Object.values(AgentType) },

    summary: {
      totalAgentOutputs: { type: Number, default: 0 },
      totalDebateExchanges: { type: Number, default: 0 },
      totalWordCount: { type: Number, default: 0 },
      phaseCompletionTimes: { type: Map, of: Date },
      iterationsCompleted: { type: Number, default: 0 },
    },

    finalReport: {
      content: { type: String },
      wordCount: { type: Number },
      generatedAt: { type: Date },
      collaborativelyApproved: { type: Boolean, default: false },
    },

    votingResults: [
      {
        voterAgent: { type: String, enum: Object.values(AgentType) },
        votedForAgent: { type: String, enum: Object.values(AgentType) },
        reasoning: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    consensusAnalysis: {
      consensusReached: { type: Boolean },
      winningAgent: { type: String, enum: Object.values(AgentType) },
      voteDistribution: { type: Map, of: Number },
      consensusPercentage: { type: Number },
      totalVotes: { type: Number },
    },

    sessionFolder: { type: String, required: true },
    fileReferences: { type: Map, of: Schema.Types.Mixed },

    version: { type: String, default: '1.0' },
  },
  {
    timestamps: true,
    collection: 'debate_sessions',
  }
);

// Indexes for better query performance
AgentOutputSchema.index({ debateId: 1, phase: 1, agentName: 1 });
AgentOutputSchema.index({ debateId: 1, roundNumber: 1 });
DebateExchangeSchema.index({ debateId: 1, roundNumber: 1 });
DebateSessionSchema.index({ topic: 'text' });
DebateSessionSchema.index({ status: 1, createdAt: -1 });
DebateSessionSchema.index({ consensusReached: 1, winningStrategy: 1 });

// Models
export const AgentOutput = mongoose.model<IAgentOutput>(
  'AgentOutput',
  AgentOutputSchema
);
export const DebateExchange = mongoose.model<IDebateExchange>(
  'DebateExchange',
  DebateExchangeSchema
);
export const DebateSession = mongoose.model<IDebateSession>(
  'DebateSession',
  DebateSessionSchema
);

// Helper functions for the debate system
export class DebateRepository {
  // Create a new debate session
  static async createDebateSession(
    topic: string,
    sessionFolder: string
  ): Promise<IDebateSession> {
    const session = new DebateSession({
      topic,
      sessionFolder,
      participatingAgents: Object.values(AgentType),
      summary: {
        totalAgentOutputs: 0,
        totalDebateExchanges: 0,
        totalWordCount: 0,
        phaseCompletionTimes: new Map(),
        iterationsCompleted: 0,
      },
    });

    return await session.save();
  }

  // Save agent output
  static async saveAgentOutput(
    debateId: Types.ObjectId,
    agentName: AgentType,
    phase: DebatePhase,
    roundNumber: number,
    content: string,
    metadata?: any
  ): Promise<IAgentOutput> {
    const wordCount = content.split(/\s+/).length;

    const agentOutput = new AgentOutput({
      debateId,
      agentName,
      phase,
      roundNumber,
      content,
      wordCount,
      metadata,
    });

    // Update debate session summary
    await DebateSession.findByIdAndUpdate(debateId, {
      $inc: {
        'summary.totalAgentOutputs': 1,
        'summary.totalWordCount': wordCount,
      },
      $set: {
        [`summary.phaseCompletionTimes.${phase}`]: new Date(),
      },
    });

    return await agentOutput.save();
  }

  // Save debate exchange
  static async saveDebateExchange(
    debateId: Types.ObjectId,
    roundNumber: number,
    questioner: AgentType,
    responder: AgentType,
    question: string,
    response: string
  ): Promise<IDebateExchange> {
    const questionWordCount = question.split(/\s+/).length;
    const responseWordCount = response.split(/\s+/).length;

    const exchange = new DebateExchange({
      debateId,
      roundNumber,
      questioner,
      responder,
      question,
      response,
      wordCounts: {
        question: questionWordCount,
        response: responseWordCount,
      },
    });

    // Update debate session summary
    await DebateSession.findByIdAndUpdate(debateId, {
      $inc: {
        'summary.totalDebateExchanges': 1,
        'summary.totalWordCount': questionWordCount + responseWordCount,
      },
    });

    return await exchange.save();
  }

  // Complete debate session
  static async completeDebateSession(
    debateId: Types.ObjectId,
    votingResults: IVotingResult[],
    consensusAnalysis: IConsensusResult,
    finalReport?: { content: string; collaborativelyApproved: boolean }
  ): Promise<IDebateSession | null> {
    const updateData: any = {
      status: 'completed',
      endTime: new Date(),
      votingResults,
      consensusAnalysis,
      consensusReached: consensusAnalysis.consensusReached,
      winningStrategy: consensusAnalysis.winningAgent,
    };

    if (finalReport) {
      updateData.finalReport = {
        content: finalReport.content,
        wordCount: finalReport.content.split(/\s+/).length,
        generatedAt: new Date(),
        collaborativelyApproved: finalReport.collaborativelyApproved,
      };
    }

    // Calculate duration
    const session = await DebateSession.findById(debateId);
    if (session) {
      updateData.duration = Math.round(
        (Date.now() - session.startTime.getTime()) / (1000 * 60)
      );
    }

    return await DebateSession.findByIdAndUpdate(debateId, updateData, {
      new: true,
    });
  }

  // Get debate session with all related data
  static async getFullDebateSession(debateId: Types.ObjectId) {
    const session = await DebateSession.findById(debateId);
    if (!session) return null;

    const agentOutputs = await AgentOutput.find({ debateId }).sort({
      phase: 1,
      roundNumber: 1,
      timestamp: 1,
    });
    const debateExchanges = await DebateExchange.find({ debateId }).sort({
      roundNumber: 1,
    });

    return {
      session,
      agentOutputs,
      debateExchanges,
    };
  }

  // Search debates
  static async searchDebates(query: string, limit: number = 20) {
    return await DebateSession.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(limit);
  }

  // Get debate statistics
  static async getDebateStats() {
    const totalDebates = await DebateSession.countDocuments();
    const completedDebates = await DebateSession.countDocuments({
      status: 'completed',
    });
    const consensusRate = await DebateSession.countDocuments({
      consensusReached: true,
    });

    const avgDuration = await DebateSession.aggregate([
      { $match: { status: 'completed', duration: { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);

    const winningAgentStats = await DebateSession.aggregate([
      { $match: { winningStrategy: { $exists: true } } },
      { $group: { _id: '$winningStrategy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalDebates,
      completedDebates,
      consensusRate,
      averageDuration: avgDuration[0]?.avgDuration || 0,
      winningAgentDistribution: winningAgentStats,
    };
  }
}
