import { useState, useEffect } from 'react';

interface AttachmentSidebarProps {
  attachmentPath: string;
  onClose: () => void;
  onDownload: () => void;
}

export const AttachmentSidebar: React.FC<AttachmentSidebarProps> = ({
  attachmentPath,
  onClose,
  onDownload,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Mock content loading - in a real app, you'd fetch from the server
        // For now, we'll simulate content based on the attachment path
        const fileName = attachmentPath.split('/').pop() || 'file';
        const agentName = fileName
          .replace(/[.-]/g, ' ')
          .replace(/txt$/, '')
          .trim();

        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setContent(`# ${agentName} Analysis

This is a detailed analysis from the ${agentName} perspective.

## Key Points

1. **Strategic Overview**: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

2. **Market Analysis**: Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

3. **Future Implications**: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Detailed Analysis

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

### Technical Considerations

- Performance metrics indicate strong potential
- Implementation complexity is moderate
- Resource requirements are within acceptable limits

### Risk Assessment

Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

## Conclusion

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`);
      } catch (err) {
        setError('Failed to load attachment content');
        console.error('Error loading attachment:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [attachmentPath]);

  const getFileName = () => {
    return attachmentPath.split('/').pop() || 'attachment';
  };

  return (
    <div className='w-96 bg-gray-800 border-l border-gray-700 flex flex-col'>
      {/* Header */}
      <div className='p-4 border-b border-gray-700 flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          <h3 className='text-lg font-semibold text-gray-100 truncate'>
            {getFileName()}
          </h3>
          <p className='text-sm text-gray-400'>Agent Analysis</p>
        </div>
        <div className='flex items-center space-x-2 ml-4'>
          <button
            onClick={onDownload}
            className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-xl transition-colors'
            title='Download'
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
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-xl transition-colors'
            title='Close'
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
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='p-6 text-center'>
            <div className='animate-pulse text-gray-400'>
              <div className='mb-4 text-lg'>Loading...</div>
            </div>
          </div>
        ) : error ? (
          <div className='p-6 text-center text-gray-300'>
            <div className='mb-4 text-lg'>Error</div>
            <div>{error}</div>
          </div>
        ) : (
          <div className='p-6'>
            <div className='prose prose-gray prose-sm max-w-none prose-invert'>
              <pre className='whitespace-pre-wrap text-sm text-gray-300 leading-relaxed'>
                {content}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-gray-700'>
        <div className='text-xs text-gray-500 text-center'>
          Generated by AI Agent
        </div>
      </div>
    </div>
  );
};
