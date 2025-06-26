import { useState } from 'react';
import { useDebate } from './hooks/useDebate';
import { HistorySidebar } from './components/sidebar/HistorySidebar';
import { AttachmentSidebar } from './components/sidebar/AttachmentSidebar';
import { ChatInterface } from './components/chat/ChatInterface';
import { TopNavigation } from './components/navigation/TopNavigation';

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

  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(
    null
  );
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true);

  const handleAttachmentClick = (attachmentPath: string) => {
    setSelectedAttachment(attachmentPath);
  };

  const handleCloseAttachment = () => {
    setSelectedAttachment(null);
  };

  const handleNewChat = () => {
    // Reset current session and start fresh
    stopDebate();
    setSelectedAttachment(null);
  };

  return (
    <div className='flex h-screen bg-gray-900 text-white'>
      {/* Left Sidebar - History */}
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onToggle={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
        currentSession={currentSession}
      />

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col'>
        {/* Top Navigation */}
        <TopNavigation
          onNewChat={handleNewChat}
          onToggleHistory={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
          currentSession={currentSession}
        />

        {/* Chat Interface */}
        <div className='flex-1 flex'>
          <ChatInterface
            currentSession={currentSession}
            messages={messages}
            isLoading={isLoading}
            error={error}
            onStartDebate={startDebate}
            onStopDebate={stopDebate}
            onAttachmentClick={handleAttachmentClick}
          />

          {/* Right Sidebar - Attachment Viewer */}
          {selectedAttachment && (
            <AttachmentSidebar
              attachmentPath={selectedAttachment}
              onClose={handleCloseAttachment}
              onDownload={() => downloadAttachment(selectedAttachment)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
