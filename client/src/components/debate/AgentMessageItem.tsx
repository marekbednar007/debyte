import React from 'react';
import type { AgentMessage } from '../../types';

interface AgentMessageItemProps {
  message: AgentMessage;
  onDownloadAttachment?: (path: string) => void;
}

export const AgentMessageItem: React.FC<AgentMessageItemProps> = ({
  message,
  onDownloadAttachment,
}) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'thinking':
        return (
          <div className='flex items-center text-yellow-600'>
            <svg
              className='animate-spin h-4 w-4 mr-2'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
                className='opacity-25'
              />
              <path
                fill='currentColor'
                className='opacity-75'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            Thinking...
          </div>
        );
      case 'speaking':
        return (
          <div className='flex items-center text-gray-400'>
            <div className='flex space-x-1 mr-2'>
              <div className='w-1 h-4 bg-gray-400 animate-pulse'></div>
              <div
                className='w-1 h-4 bg-gray-400 animate-pulse'
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className='w-1 h-4 bg-gray-400 animate-pulse'
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            Speaking...
          </div>
        );
      case 'complete':
        return (
          <div className='flex items-center text-green-600'>
            <svg
              className='h-4 w-4 mr-2'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
            Complete
          </div>
        );
      default:
        return null;
    }
  };

  const getAgentColor = (agentName: string) => {
    const colors = {
      'First Principles Physicist': 'border-l-gray-500 bg-gray-800',
      'Systems Futurist': 'border-l-gray-400 bg-gray-800',
      'Pattern Synthesizer': 'border-l-gray-600 bg-gray-800',
      'Civilizational Architect': 'border-l-gray-300 bg-gray-800',
      'Entrepreneurial Visionary': 'border-l-gray-700 bg-gray-800',
      'Meta-Learning Strategist': 'border-l-gray-200 bg-gray-800',
    };
    return (
      colors[agentName as keyof typeof colors] ||
      'border-l-gray-500 bg-gray-800'
    );
  };

  return (
    <div
      className={`border-l-4 p-4 mb-4 rounded-r-lg ${getAgentColor(
        message.agent
      )}`}
    >
      <div className='flex justify-between items-start mb-2'>
        <div>
          <h4 className='font-semibold text-gray-900'>{message.agent}</h4>
          <p className='text-sm text-gray-500'>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <div className='text-sm'>{getStatusIcon()}</div>
      </div>

      {message.status === 'complete' && (
        <div className='mt-3'>
          {message.attachmentPath && onDownloadAttachment && (
            <button
              onClick={() => onDownloadAttachment(message.attachmentPath!)}
              className='inline-flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              <svg
                className='h-4 w-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              Download Strategy ({message.agent})
            </button>
          )}

          {message.content && (
            <div className='mt-2 p-3 bg-white rounded border text-sm text-gray-700 max-h-32 overflow-y-auto'>
              <p className='whitespace-pre-wrap'>
                {message.content.substring(0, 300)}...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
