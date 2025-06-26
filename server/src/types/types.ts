export type ServerError = {
  log: string;
  status: number;
  message: { err: string };
};

// Enum for debate phases
export enum DebatePhase {
  RESEARCH = 'research',
  PRESENTATION = 'presentation',
  EMBODIMENT = 'embodiment',
  ADJUSTMENT = 'adjustment',
  DEBATE = 'debate',
  VOTING = 'voting',
  FINAL_REPORT = 'final_report',
}

// Enum for agent types
export enum AgentType {
  FIRST_PRINCIPLES_PHYSICIST = 'First Principles Physicist',
  SYSTEMS_FUTURIST = 'Systems Futurist',
  PATTERN_SYNTHESIZER = 'Pattern Synthesizer',
  CIVILIZATIONAL_ARCHITECT = 'Civilizational Architect',
  ENTREPRENEURIAL_VISIONARY = 'Entrepreneurial Visionary',
  META_LEARNING_STRATEGIST = 'Meta-Learning Strategist',
}

// Interface for voting results
export interface IVotingResult {
  voterAgent: AgentType;
  votedForAgent: AgentType;
  reasoning: string;
  timestamp: Date;
}

// Interface for consensus analysis
export interface IConsensusResult {
  consensusReached: boolean;
  winningAgent?: AgentType;
  voteDistribution: Map<AgentType, number>;
  consensusPercentage: number;
  totalVotes: number;
}
