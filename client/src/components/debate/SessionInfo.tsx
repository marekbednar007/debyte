import React from 'react';
import type { DebateSession } from '../../types';
import { Card } from '../ui';

interface SessionInfoProps {
  session: DebateSession;
  onStop: () => void;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({
  session,
  onStop,
}) => {
  return (
    <Card>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Active Debate Session
          </h3>
          <p className='text-gray-700 mb-4'>
            <strong>Topic:</strong> {session.topic}
          </p>
          <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
            <div>
              <strong>Status:</strong>{' '}
              <span className='capitalize'>{session.status}</span>
            </div>
            <div>
              <strong>Iteration:</strong> {session.currentIteration} /{' '}
              {session.maxIterations}
            </div>
            <div>
              <strong>Agents:</strong> {session.participatingAgents.length}
            </div>
            <div>
              <strong>Started:</strong>{' '}
              {new Date(session.startTime).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <button
          onClick={onStop}
          className='ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors'
        >
          Stop Debate
        </button>
      </div>
    </Card>
  );
};
