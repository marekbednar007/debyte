import { useState, useEffect } from 'react';
import type { DebateSession } from '../../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentSession: DebateSession | null;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  currentSession,
}) => {
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDebates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/debates');
        const data = await response.json();
        setDebates(data.debates || []);
      } catch (error) {
        console.error('Failed to fetch debate history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDebates();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateTitle = (title: string, maxLength = 50) => {
    return title.length > maxLength
      ? title.substring(0, maxLength) + '...'
      : title;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='w-80 bg-gray-800 border-r border-gray-700 flex flex-col'>
      {/* Header */}
      <div className='p-4 border-b border-gray-700'>
        <h2 className='text-lg font-semibold text-white mb-2'>Chat History</h2>
        <div className='text-sm text-gray-400'>
          {debates.length} debate{debates.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* History List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='p-4 text-center text-gray-400'>
            <div className='animate-pulse'>Loading history...</div>
          </div>
        ) : debates.length === 0 ? (
          <div className='p-4 text-center text-gray-400'>
            <div className='mb-2'>🤖</div>
            <div>No debates yet</div>
            <div className='text-xs mt-1'>
              Start a new conversation to begin
            </div>
          </div>
        ) : (
          <div className='p-2 space-y-2'>
            {debates.map((debate) => (
              <div
                key={debate._id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSession?._id === debate._id
                    ? 'bg-gray-700 border border-gray-600'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium text-white mb-1'>
                      {truncateTitle(debate.topic)}
                    </div>
                    <div className='flex items-center space-x-2 text-xs text-gray-400'>
                      <span>{formatDate(debate.startTime)}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          debate.status === 'complete'
                            ? 'bg-green-900 text-green-300'
                            : debate.status === 'active'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }`}
                      >
                        {debate.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-gray-700'>
        <div className='text-xs text-gray-400 text-center'>
          AI Board of Directors
        </div>
      </div>
    </div>
  );
};
