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

  // Function to format markdown-like text
  const formatMessageContent = (content: string) => {
    let formatted = content;

    // Replace markdown formatting
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic text

    // Headers
    formatted = formatted.replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold mb-2 mt-4 text-gray-100">$1</h3>'
    );
    formatted = formatted.replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold mb-3 mt-4 text-gray-100">$1</h2>'
    );
    formatted = formatted.replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold mb-4 mt-4 text-gray-100">$1</h1>'
    );

    // Lists
    formatted = formatted.replace(
      /^\- (.*$)/gim,
      '<div class="ml-4 mb-1">• $1</div>'
    );
    formatted = formatted.replace(
      /^\d+\. (.*$)/gim,
      '<div class="ml-4 mb-1">$1</div>'
    );

    // Clean up excessive line breaks
    formatted = formatted.replace(/\n\n\n+/g, '\n\n'); // Replace multiple line breaks with double
    formatted = formatted.replace(/\n\n/g, '<br><br>'); // Double line breaks become paragraph breaks
    formatted = formatted.replace(/\n/g, '<br>'); // Single line breaks

    return formatted;
  };

  const handleStartDebate = () => {
    const topic = selectedPrompt || customPrompt.trim();
    if (topic) {
      onStartDebate(topic, maxIterations);
    }
  };

  const getAgentIcon = (agentName: string) => {
    // Removed all emojis - using initials instead
    const initials: Record<string, string> = {
      'First Principles Physicist': 'FP',
      'Systems Futurist': 'SF',
      'Pattern Synthesizer': 'PS',
      'Civilizational Architect': 'CA',
      'Entrepreneurial Visionary': 'EV',
      'Meta-Learning Strategist': 'ML',
    };
    return initials[agentName] || 'AG';
  };

  const getAgentColor = (agentName: string) => {
    const colors: Record<string, string> = {
      'First Principles Physicist': 'border-gray-600 bg-gray-700',
      'Systems Futurist': 'border-gray-500 bg-gray-600',
      'Pattern Synthesizer': 'border-gray-600 bg-gray-700',
      'Civilizational Architect': 'border-gray-500 bg-gray-600',
      'Entrepreneurial Visionary': 'border-gray-600 bg-gray-700',
      'Meta-Learning Strategist': 'border-gray-500 bg-gray-600',
    };
    return colors[agentName] || 'border-gray-600 bg-gray-700';
  };

  if (!currentSession) {
    return (
      <div className='flex-1 flex flex-col'>
        {/* Welcome Header */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='max-w-3xl mx-auto text-center px-6'>
            <div className='mb-8'>
              <h1 className='text-4xl font-bold text-gray-100 mb-6'>
                Multi-Agent Debate System
              </h1>
            </div>

            {/* Prompt Selection */}
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-100 mb-4'>
                  Select a topic
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {DEBATE_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setCustomPrompt('');
                      }}
                      className={`p-4 text-left rounded-xl border transition-colors ${
                        selectedPrompt === prompt
                          ? 'border-gray-500 bg-gray-700 text-gray-100'
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
                    className='w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 focus:border-gray-500 focus:outline-none resize-none'
                    rows={3}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className='flex items-center justify-center space-x-6'>
                <div className='flex items-center space-x-2'>
                  <label className='text-sm text-gray-300'>
                    Debate rounds:
                  </label>
                  <select
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className='bg-gray-800 border border-gray-600 rounded-xl px-3 py-1 text-gray-100 text-sm'
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
                  className='px-8 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-100 rounded-xl font-medium transition-colors'
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
          <h2 className='text-xl font-semibold text-gray-100 mb-2'>
            {currentSession.topic}
          </h2>
          <div className='text-sm text-gray-400'>
            Round {currentSession.currentIteration} of{' '}
            {currentSession.maxIterations}
          </div>
        </div>

        {/* Agent Messages */}
        {messages.map((message) => (
          <div key={message.id} className='flex space-x-4 max-w-4xl'>
            <div
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-semibold ${getAgentColor(
                message.agent
              )}`}
            >
              {getAgentIcon(message.agent)}
            </div>

            <div className='flex-1 min-w-0 max-w-3xl'>
              <div className='flex items-center space-x-2 mb-2'>
                <span className='font-medium text-gray-100'>
                  {message.agent}
                </span>
                <span className='text-xs text-gray-500'>
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.status === 'thinking' && (
                  <span className='text-xs text-gray-400 animate-pulse'>
                    Thinking...
                  </span>
                )}
                {message.status === 'speaking' && (
                  <span className='text-xs text-gray-400 animate-pulse'>
                    Speaking...
                  </span>
                )}
              </div>

              {message.content && (
                <div className='bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-300'>
                  <div
                    className='text-sm leading-relaxed prose prose-sm max-w-none prose-invert'
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content),
                    }}
                  />

                  {message.attachmentPath && (
                    <div className='mt-3 pt-3 border-t border-gray-700'>
                      <button
                        onClick={() =>
                          onAttachmentClick(message.attachmentPath!)
                        }
                        className='flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-sm'
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
              <div className='text-sm mb-2'>Processing...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-gray-800 border border-gray-600 rounded-xl p-4 text-gray-300'>
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
              className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl text-sm transition-colors'
            >
              Stop Debate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
