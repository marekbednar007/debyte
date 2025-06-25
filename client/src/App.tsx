import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Download,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  History,
  Brain,
  Lightbulb,
} from 'lucide-react';
import axios from 'axios';

// Types
interface DebateSession {
  _id: string;
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  consensusReached: boolean;
  winningStrategy?: string;
}

interface AgentOutput {
  _id: string;
  agentName: string;
  phase: string;
  content: string;
  timestamp: string;
}

interface StreamingMessage {
  type: 'agent_output' | 'phase_change' | 'status_update' | 'final_report';
  agentName?: string;
  phase?: string;
  content?: string;
  status?: string;
}

// Agent styling configuration
const AGENT_STYLES = {
  'First Principles Physicist': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: '⚛️',
  },
  'Systems Futurist': {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: '🔮',
  },
  'Pattern Synthesizer': {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: '🧩',
  },
  'Civilizational Architect': {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: '🏛️',
  },
  'Entrepreneurial Visionary': {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '🚀',
  },
  'Meta-Learning Strategist': {
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    icon: '🧠',
  },
};

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  // State management
  const [topic, setTopic] = useState('');
  const [currentSession, setCurrentSession] = useState<DebateSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AgentOutput[]>([]);
  const [sessionHistory, setSessionHistory] = useState<DebateSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [streamingContent, setStreamingContent] = useState<{
    [key: string]: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory();
  }, []);

  // Load session history from backend
  const loadSessionHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/debates?limit=20`);
      setSessionHistory(response.data.debates);
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  // Start a new debate session
  const startDebate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setMessages([]);
    setStreamingContent({});
    setCurrentPhase('Initializing...');
    setError(null); // Clear any previous errors

    try {
      // Start the debate session
      const response = await axios.post(`${API_BASE_URL}/debates`, {
        topic: topic.trim(),
        maxIterations: 3,
      });

      const session = response.data.session;
      setCurrentSession(session);

      // Set up Server-Sent Events for streaming
      setupEventStream(session._id);
    } catch (error) {
      console.error('Failed to start debate:', error);
      setError('Failed to start debate. Please try again.');
      setIsLoading(false);
    }
  };

  // Set up SSE connection for streaming updates
  const setupEventStream = (sessionId: string) => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/debates/${sessionId}/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data: StreamingMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'agent_output':
          if (data.agentName && data.content) {
            const agentName = data.agentName as string;
            setStreamingContent((prev) => ({
              ...prev,
              [agentName]: data.content || '',
            }));
          }
          break;

        case 'phase_change':
          if (data.phase) {
            setCurrentPhase(data.phase);
            // Clear streaming content when phase changes
            setStreamingContent({});
          }
          break;

        case 'status_update':
          if (data.status === 'completed' || data.status === 'failed') {
            setIsLoading(false);
            eventSource.close();
            loadSessionHistory();
          }
          break;

        case 'final_report':
          // Handle final report completion
          setCurrentPhase('Debate Complete! 🎉');
          setIsLoading(false);
          eventSource.close();
          break;
      }
    };

    eventSource.onerror = () => {
      console.error('EventSource failed');
      setError('Connection lost. Please refresh and try again.');
      setIsLoading(false);
      eventSource.close();
    };
  };

  // Select a session from history
  const selectSession = async (session: DebateSession) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/debates/${session._id}`
      );
      setCurrentSession(session);
      setMessages(response.data.agentOutputs || []);
      setTopic(session.topic);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // Download final report
  const downloadReport = async () => {
    if (!currentSession) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/debates/${currentSession._id}/report`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `debate_report_${currentSession._id}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100 flex'>
      {/* Sidebar - Session History */}
      <div
        className={`${
          showHistory ? 'w-80' : 'w-12'
        } transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col`}
      >
        <div className='p-4 border-b border-gray-700'>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className='w-full flex items-center justify-center p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors'
          >
            <History className='h-5 w-5' />
            {showHistory && <span className='ml-2'>History</span>}
          </button>
        </div>

        {showHistory && (
          <div className='flex-1 overflow-y-auto p-4 space-y-2'>
            <h3 className='text-sm font-semibold text-gray-400 mb-4'>
              Recent Debates
            </h3>
            {sessionHistory.map((session) => (
              <button
                key={session._id}
                onClick={() => selectSession(session)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  currentSession?._id === session._id
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className='truncate text-sm font-medium mb-1'>
                  {session.topic}
                </div>
                <div className='flex items-center justify-between text-xs text-gray-400'>
                  <span
                    className={`flex items-center ${
                      session.status === 'completed'
                        ? 'text-green-400'
                        : session.status === 'failed'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {session.status === 'completed' ? (
                      <CheckCircle className='h-3 w-3 mr-1' />
                    ) : session.status === 'failed' ? (
                      <XCircle className='h-3 w-3 mr-1' />
                    ) : (
                      <Clock className='h-3 w-3 mr-1' />
                    )}
                    {session.status}
                  </span>
                  <span>
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='border-b border-gray-700 p-6'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='text-3xl font-bold mb-2 flex items-center'>
              <Brain className='h-8 w-8 mr-3 text-blue-400' />
              AI Board of Directors
            </h1>
            <p className='text-gray-400'>
              Debate complex decisions with your personal board of long-term
              thinking advisors
            </p>
          </div>
        </div>

        {/* Topic Input */}
        {!isLoading && !currentSession && (
          <div className='p-6 border-b border-gray-700'>
            <div className='max-w-4xl mx-auto'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    What would you like the board to debate?
                  </label>
                  <div className='flex space-x-4'>
                    <input
                      type='text'
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder='e.g., Should I leave my corporate job to start my own company?'
                      className='flex-1 p-4 rounded-lg bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors'
                      onKeyPress={(e) => e.key === 'Enter' && startDebate()}
                    />
                    <button
                      onClick={startDebate}
                      disabled={!topic.trim()}
                      className='px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center'
                    >
                      <Send className='h-5 w-5 mr-2' />
                      Start Debate
                    </button>
                  </div>
                </div>

                {/* Example topics */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {[
                    'Should I invest in AI startups or traditional stocks?',
                    "What's the best learning strategy for the next decade?",
                    'Should I focus on depth or breadth in skill development?',
                    'How should I structure my career for an AI-driven future?',
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setTopic(example)}
                      className='text-left p-3 rounded-lg bg-gray-800 border border-gray-600 hover:border-gray-500 transition-colors text-sm'
                    >
                      <Lightbulb className='h-4 w-4 inline mr-2 text-yellow-400' />
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debate Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-4xl mx-auto space-y-6'>
            {/* Error Display */}
            {error && (
              <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                <div className='flex items-center'>
                  <XCircle className='h-5 w-5 text-red-400 mr-3' />
                  <span className='text-red-400 font-medium'>{error}</span>
                </div>
              </div>
            )}

            {/* Current Phase Status */}
            {isLoading && (
              <div className='bg-gray-800 rounded-lg p-4 border border-gray-700'>
                <div className='flex items-center'>
                  <Loader2 className='h-5 w-5 animate-spin mr-3 text-blue-400' />
                  <span className='font-medium'>{currentPhase}</span>
                </div>
                <div className='mt-2 text-sm text-gray-400'>
                  The board is analyzing your topic and preparing their
                  strategies...
                </div>
              </div>
            )}

            {/* Agent Messages */}
            {messages.map((message, index) => {
              const agentStyle =
                AGENT_STYLES[message.agentName as keyof typeof AGENT_STYLES];

              return (
                <div
                  key={index}
                  className={`rounded-lg p-6 border ${agentStyle.bgColor} ${agentStyle.borderColor}`}
                >
                  <div className='flex items-center mb-3'>
                    <span className='text-2xl mr-3'>{agentStyle.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${agentStyle.color}`}>
                        {message.agentName}
                      </h3>
                      <p className='text-xs text-gray-400'>
                        {message.phase} •{' '}
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className='prose prose-invert max-w-none'>
                    <div className='whitespace-pre-wrap text-gray-200'>
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming Content */}
            {Object.entries(streamingContent).map(([agentName, content]) => {
              const agentStyle =
                AGENT_STYLES[agentName as keyof typeof AGENT_STYLES];

              return (
                <div
                  key={agentName}
                  className={`rounded-lg p-6 border ${agentStyle.bgColor} ${agentStyle.borderColor}`}
                >
                  <div className='flex items-center mb-3'>
                    <span className='text-2xl mr-3'>{agentStyle.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${agentStyle.color}`}>
                        {agentName}
                      </h3>
                      <p className='text-xs text-gray-400 flex items-center'>
                        <Loader2 className='h-3 w-3 animate-spin mr-1' />
                        Thinking...
                      </p>
                    </div>
                  </div>
                  <div className='prose prose-invert max-w-none'>
                    <div className='whitespace-pre-wrap text-gray-200'>
                      {content}
                      <span className='inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1'></span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Final Actions */}
            {currentSession && currentSession.status === 'completed' && (
              <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-green-400 font-semibold mb-2'>
                      Debate Complete! 🎉
                    </h3>
                    <p className='text-gray-300'>
                      {currentSession.consensusReached
                        ? `Consensus reached: ${currentSession.winningStrategy}`
                        : 'The board provided comprehensive analysis from multiple perspectives.'}
                    </p>
                  </div>
                  <button
                    onClick={downloadReport}
                    className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Download Report
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-700 p-4'>
          <div className='max-w-4xl mx-auto text-center text-sm text-gray-400'>
            <div className='flex items-center justify-center space-x-6'>
              <span className='flex items-center'>
                <Users className='h-4 w-4 mr-1' />6 Board Members
              </span>
              <span className='flex items-center'>
                <MessageSquare className='h-4 w-4 mr-1' />
                Real-time Streaming
              </span>
              <span className='flex items-center'>
                <Brain className='h-4 w-4 mr-1' />
                AI-Powered Analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
