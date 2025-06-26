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
    loadHistoricalDebate,
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

  const handleSelectDebate = (debate: any) => {
    // Load the selected debate's messages and display them
    if (debate._id) {
      loadHistoricalDebate(debate._id);
    }
  };

  return (
    <div className='flex h-screen bg-gray-900 text-gray-100'>
      {/* Left Sidebar - History */}
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onToggle={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
        currentSession={currentSession}
        onSelectDebate={handleSelectDebate}
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
