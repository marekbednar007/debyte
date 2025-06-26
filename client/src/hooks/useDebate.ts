import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type { DebateSession, AgentMessage, StreamingData } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const useDebate = () => {
  const [currentSession, setCurrentSession] = useState<DebateSession | null>(
    null
  );
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addMessage = useCallback(
    (agent: string, status: AgentMessage['status'], content?: string) => {
      const message: AgentMessage = {
        id: `${agent}-${Date.now()}`,
        agent,
        status,
        content,
        timestamp: new Date(),
        attachmentPath:
          status === 'complete'
            ? `/debate-outputs/${agent.toLowerCase().replace(' ', '-')}.txt`
            : undefined,
      };

      setMessages((prev) => {
        const existing = prev.find(
          (m) => m.agent === agent && m.status !== 'complete'
        );
        if (existing) {
          return prev.map((m) => (m.id === existing.id ? message : m));
        }
        return [...prev, message];
      });
    },
    []
  );

  const startDebate = useCallback(
    async (topic: string, maxIterations: number = 3) => {
      setIsLoading(true);
      setError(null);
      setMessages([]);

      try {
        // Start the debate session
        const response = await axios.post(`${API_BASE_URL}/debates`, {
          topic: topic.trim(),
          maxIterations,
        });

        const session = response.data.session;
        setCurrentSession(session);

        // Set up Server-Sent Events for streaming
        const eventSource = new EventSource(
          `${API_BASE_URL}/debates/${session._id}/stream`
        );
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data: StreamingData = JSON.parse(event.data);

            switch (data.type) {
              case 'agent_status':
                if (data.agent) {
                  addMessage(
                    data.agent,
                    data.data.status === 'researching' ? 'thinking' : 'speaking'
                  );
                }
                break;

              case 'agent_output':
                if (data.agent && data.data.content) {
                  addMessage(data.agent, 'complete', data.data.content);
                }
                break;

              case 'session_update':
                setCurrentSession((prev) =>
                  prev ? { ...prev, ...data.data } : null
                );
                break;

              case 'error':
                setError(data.data.message || 'An error occurred');
                break;
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          setError('Connection lost. Please refresh to reconnect.');
          eventSource.close();
        };
      } catch (err: any) {
        console.error('Error starting debate:', err);
        setError(err.response?.data?.error || 'Failed to start debate');
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  const stopDebate = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setCurrentSession(null);
    setMessages([]);
  }, []);

  const downloadAttachment = useCallback(async (attachmentPath: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/files${attachmentPath}`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentPath.split('/').pop() || 'download.txt';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  }, []);

  return {
    currentSession,
    messages,
    isLoading,
    error,
    startDebate,
    stopDebate,
    downloadAttachment,
  };
};
