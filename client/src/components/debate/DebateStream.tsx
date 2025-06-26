import React, { useEffect, useRef } from 'react';
import type { AgentMessage } from '../../types';
import { AgentMessageItem } from './AgentMessageItem';

interface DebateStreamProps {
  messages: AgentMessage[];
  onDownloadAttachment?: (path: string) => void;
}

export const DebateStream: React.FC<DebateStreamProps> = ({
  messages,
  onDownloadAttachment,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center'>
        <div className='text-gray-500'>
          <svg
            className='mx-auto h-12 w-12 mb-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z'
            />
          </svg>
          <p className='text-lg'>Waiting for debate to begin...</p>
          <p className='text-sm mt-2'>
            The AI Board of Directors will appear here once the session starts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200'>
      <div className='p-4 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900'>
          AI Board of Directors Debate
        </h3>
        <p className='text-sm text-gray-600'>
          {messages.length} agent contributions
        </p>
      </div>

      <div className='p-4 max-h-96 overflow-y-auto'>
        {messages.map((message) => (
          <AgentMessageItem
            key={message.id}
            message={message}
            onDownloadAttachment={onDownloadAttachment}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
