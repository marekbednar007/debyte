import { useDebate } from './hooks/useDebate';
import { DebateStarter, SessionInfo, DebateStream } from './components/debate';

function App() {
  const {
    currentSession,
    messages,
    isLoading,
    error,
    startDebate,
    stopDebate,
    downloadAttachment,
  } = useDebate();

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-3'>
              <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg'>
                <svg
                  className='w-6 h-6 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  AI Board of Directors
                </h1>
                <p className='text-sm text-gray-600'>
                  Multi-Agent Debate System
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              <div className='flex items-center space-x-1'>
                <svg
                  className='w-4 h-4'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>6 AI Agents</span>
              </div>
              {currentSession && (
                <div className='flex items-center space-x-1'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span>Session Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Debate Starter & Session Info */}
          <div className='lg:col-span-1 space-y-6'>
            {!currentSession ? (
              <DebateStarter
                onStartDebate={startDebate}
                isLoading={isLoading}
              />
            ) : (
              <SessionInfo session={currentSession} onStop={stopDebate} />
            )}

            {/* Error Display */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-center'>
                  <svg
                    className='w-5 h-5 text-red-400 mr-2'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-red-800 text-sm'>{error}</span>
                </div>
              </div>
            )}

            {/* Agent Info Panel */}
            <div className='bg-white rounded-lg shadow-md border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                The Board Members
              </h3>
              <div className='space-y-3'>
                {[
                  {
                    name: 'First Principles Physicist',
                    icon: '⚛️',
                    color: 'text-blue-600',
                  },
                  {
                    name: 'Systems Futurist',
                    icon: '🌐',
                    color: 'text-purple-600',
                  },
                  {
                    name: 'Pattern Synthesizer',
                    icon: '🧩',
                    color: 'text-green-600',
                  },
                  {
                    name: 'Civilizational Architect',
                    icon: '🏛️',
                    color: 'text-yellow-600',
                  },
                  {
                    name: 'Entrepreneurial Visionary',
                    icon: '🚀',
                    color: 'text-red-600',
                  },
                  {
                    name: 'Meta-Learning Strategist',
                    icon: '🎯',
                    color: 'text-indigo-600',
                  },
                ].map((agent) => (
                  <div key={agent.name} className='flex items-center space-x-3'>
                    <span className='text-lg'>{agent.icon}</span>
                    <span className={`text-sm font-medium ${agent.color}`}>
                      {agent.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Debate Stream */}
          <div className='lg:col-span-2'>
            <DebateStream
              messages={messages}
              onDownloadAttachment={downloadAttachment}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-200 mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center text-sm text-gray-500'>
            <p>AI Board of Directors - Multi-Agent Debate System</p>
            <p className='mt-1'>
              Powered by advanced AI agents working collaboratively
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
