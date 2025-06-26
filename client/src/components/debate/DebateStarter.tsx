import React, { useState } from 'react';
import { Button, Input, Card } from '../ui';

interface DebateStarterProps {
  onStartDebate: (topic: string, maxIterations: number) => void;
  isLoading: boolean;
}

export const DebateStarter: React.FC<DebateStarterProps> = ({
  onStartDebate,
  isLoading,
}) => {
  const [topic, setTopic] = useState('');
  const [maxIterations, setMaxIterations] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onStartDebate(topic.trim(), maxIterations);
    }
  };

  const suggestedTopics = [
    'Should I invest in AI startups or traditional stocks?',
    "What's the best learning strategy for the next decade?",
    'Should AI development prioritize safety or innovation?',
    'How should we prepare for the future of work?',
    "What's the optimal approach to sustainable energy transition?",
  ];

  return (
    <Card title='Start New Debate'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input
          label='Debate Topic'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='Enter a topic for the AI Board of Directors to debate...'
          disabled={isLoading}
        />

        <div className='flex items-center space-x-4'>
          <label className='text-sm font-medium text-gray-700'>
            Max Iterations:
          </label>
          <select
            value={maxIterations}
            onChange={(e) => setMaxIterations(parseInt(e.target.value))}
            className='px-3 py-1 border border-gray-300 rounded-md'
            disabled={isLoading}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>

        <Button
          type='submit'
          isLoading={isLoading}
          disabled={!topic.trim() || isLoading}
          className='w-full'
        >
          {isLoading ? 'Starting Debate...' : 'Start Debate'}
        </Button>
      </form>

      <div className='mt-6'>
        <h4 className='text-sm font-medium text-gray-700 mb-2'>
          Suggested Topics:
        </h4>
        <div className='space-y-2'>
          {suggestedTopics.map((suggestedTopic, index) => (
            <button
              key={index}
              onClick={() => setTopic(suggestedTopic)}
              className='text-left w-full text-sm text-blue-600 hover:text-blue-800 hover:underline'
              disabled={isLoading}
            >
              {suggestedTopic}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
