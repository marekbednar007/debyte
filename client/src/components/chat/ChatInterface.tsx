import { useState } from 'react';
import type { DebateSession, AgentMessage } from '../../types';

interface ChatInterfaceProps {
  currentSession: DebateSession | null;
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  onStartDebate: (topic: string, maxIterations: number) => void;
  onStopDebate: () => void;
  onAttachmentClick: (attachmentPath: string) => void;
}

const DEBATE_PROMPTS = [
  "What's the best learning strategy for the next decade?",
  'Should AI development prioritize safety or innovation?',
  'How should we approach the future of work in an AI world?',
  'What are the most critical decisions facing humanity in the next 10 years?',
  'How can we build more resilient societies?',
  "What's the optimal balance between individual freedom and collective responsibility?",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  messages,
  isLoading,
  error,
  onStartDebate,
  onStopDebate,
  onAttachmentClick,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(3);

  const handleStartDebate = () => {
    const topic = selectedPrompt || customPrompt.trim();
    if (topic) {
      onStartDebate(topic, maxIterations);
    }
  };

  const getAgentIcon = (agentName: string) => {
    const icons: Record<string, string> = {
      'First Principles Physicist': '⚛️',
      'Systems Futurist': '🌐',
      'Pattern Synthesizer': '🧩',
      'Civilizational Architect': '🏛️',
      'Entrepreneurial Visionary': '🚀',
      'Meta-Learning Strategist': '🎯',
    };
    return icons[agentName] || '🤖';
  };

  const getAgentColor = (agentName: string) => {
    const colors: Record<string, string> = {
      'First Principles Physicist': 'border-blue-500 bg-blue-500/10',
      'Systems Futurist': 'border-purple-500 bg-purple-500/10',
      'Pattern Synthesizer': 'border-green-500 bg-green-500/10',
      'Civilizational Architect': 'border-yellow-500 bg-yellow-500/10',
      'Entrepreneurial Visionary': 'border-red-500 bg-red-500/10',
      'Meta-Learning Strategist': 'border-indigo-500 bg-indigo-500/10',
    };
    return colors[agentName] || 'border-gray-500 bg-gray-500/10';
  };

  if (!currentSession) {
    return (
      <div className='flex-1 flex flex-col'>
        {/* Welcome Header */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='max-w-3xl mx-auto text-center px-6'>
            <div className='mb-8'>
              <div className='text-6xl mb-4'>🤖</div>
              <h1 className='text-4xl font-bold text-white mb-2'>
                AI Board of Directors
              </h1>
              <p className='text-lg text-gray-400'>
                Start a multi-agent debate on any topic
              </p>
            </div>

            {/* Prompt Selection */}
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-white mb-4'>
                  Choose a debate topic
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {DEBATE_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setCustomPrompt('');
                      }}
                      className={`p-4 text-left rounded-lg border transition-colors ${
                        selectedPrompt === prompt
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className='space-y-4'>
                <div className='text-center text-gray-400'>or</div>
                <div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      setSelectedPrompt('');
                    }}
                    placeholder='Enter your own debate topic...'
                    className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none'
                    rows={3}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className='flex items-center justify-center space-x-6'>
                <div className='flex items-center space-x-2'>
                  <label className='text-sm text-gray-400'>
                    Debate rounds:
                  </label>
                  <select
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className='bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm'
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>

              {/* Start Button */}
              <div className='pt-4'>
                <button
                  onClick={handleStartDebate}
                  disabled={!selectedPrompt && !customPrompt.trim()}
                  className='px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors'
                >
                  Start Debate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col'>
      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-6 space-y-6'>
        {/* Topic Header */}
        <div className='text-center py-6 border-b border-gray-700'>
          <h2 className='text-xl font-semibold text-white mb-2'>
            {currentSession.topic}
          </h2>
          <div className='text-sm text-gray-400'>
            Round {currentSession.currentIteration} of{' '}
            {currentSession.maxIterations}
          </div>
        </div>

        {/* Agent Messages */}
        {messages.map((message) => (
          <div key={message.id} className='flex space-x-4'>
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${getAgentColor(
                message.agent
              )}`}
            >
              {getAgentIcon(message.agent)}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center space-x-2 mb-2'>
                <span className='font-medium text-white'>{message.agent}</span>
                <span className='text-xs text-gray-500'>
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.status === 'thinking' && (
                  <span className='text-xs text-blue-400 animate-pulse'>
                    Thinking...
                  </span>
                )}
                {message.status === 'speaking' && (
                  <span className='text-xs text-green-400 animate-pulse'>
                    Speaking...
                  </span>
                )}
              </div>

              {message.content && (
                <div className='bg-gray-800 rounded-lg p-4 text-gray-300'>
                  <div className='whitespace-pre-wrap text-sm leading-relaxed'>
                    {message.content}
                  </div>

                  {message.attachmentPath && (
                    <div className='mt-3 pt-3 border-t border-gray-700'>
                      <button
                        onClick={() =>
                          onAttachmentClick(message.attachmentPath!)
                        }
                        className='flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          />
                        </svg>
                        <span>View detailed analysis</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className='text-center py-8'>
            <div className='animate-pulse text-gray-400'>
              <div className='text-2xl mb-2'>🤖</div>
              <div>AI agents are debating...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300'>
            <div className='flex items-center space-x-2'>
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {currentSession && (
        <div className='border-t border-gray-700 p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-400'>
              {messages.filter((m) => m.status === 'complete').length} agents
              completed
            </div>
            <button
              onClick={onStopDebate}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors'
            >
              Stop Debate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
