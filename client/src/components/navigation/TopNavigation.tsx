import type { DebateSession } from '../../types';

interface TopNavigationProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  currentSession: DebateSession | null;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  onNewChat,
  onToggleHistory,
  currentSession,
}) => {
  return (
    <div className='h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4'>
      {/* Left side */}
      <div className='flex items-center space-x-4'>
        <button
          onClick={onToggleHistory}
          className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-xl transition-colors'
          title='Toggle sidebar'
        >
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
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>

        <button
          onClick={onNewChat}
          className='flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl transition-colors text-sm'
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
              d='M12 4v16m8-8H4'
            />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Center - Current session info */}
      <div className='flex-1 text-center'>
        {currentSession && (
          <div className='flex items-center justify-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                currentSession.status === 'active'
                  ? 'bg-gray-700 animate-pulse'
                  : currentSession.status === 'complete'
                  ? 'bg-gray-400'
                  : 'bg-gray-500'
              }`}
            ></div>
            <span className='text-sm text-gray-300 truncate max-w-md'>
              {currentSession.topic}
            </span>
            <span className='text-xs text-gray-500'>
              ({currentSession.currentIteration}/{currentSession.maxIterations})
            </span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className='flex items-center space-x-4'>
        {/* Removed AI Board of Directors text */}
      </div>
    </div>
  );
};
