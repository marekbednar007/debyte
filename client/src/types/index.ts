export interface Agent {
  name: string;
  role: string;
  perspective: string;
  avatar?: string;
}

export interface AgentMessage {
  id: string;
  agent: string;
  status: 'thinking' | 'speaking' | 'complete';
  content?: string;
  timestamp: Date;
  attachmentPath?: string;
  wordCount?: number;
}

export interface DebateSession {
  _id: string;
  topic: string;
  status: 'active' | 'complete' | 'paused';
  currentIteration: number;
  maxIterations: number;
  participatingAgents: string[];
  startTime: string;
  sessionFolder: string;
}

export interface StreamingData {
  type: 'agent_status' | 'agent_output' | 'session_update' | 'error';
  agent?: string;
  data: any;
  timestamp: string;
}
