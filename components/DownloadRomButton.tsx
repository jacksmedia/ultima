// DownloadRomButton.tsx authored by Claude Sonnet 4 - REFACTORED
import React, { useState } from 'react';

interface DownloadRomButtonProps {
  onGenerateRom: () => Promise<{
    patchedRom: Uint8Array;
    readmesToDownload: { filename: string; content: string }[]
  }>; // now offers readme on pattern match to filename
  filename: string;
  disabled?: boolean;
}

const DownloadRomButton: React.FC<DownloadRomButtonProps> = ({ 
  onGenerateRom, 
  filename, 
  disabled = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (disabled) return;
    
    try {
      setIsGenerating(true);

      // Generate patched rom; retrieve any readmes
      console.log('Generating patched ROM for download...');
      const { patchedRom, readmesToDownload } = await onGenerateRom();
      
      // Create and trigger download
      const romBlob = new Blob([patchedRom], { type: 'application/octet-stream' });
      const romUrl = URL.createObjectURL(romBlob);
      
      const romLink = document.createElement('a');
      romLink.href = romUrl;
      romLink.download = filename;
      document.body.appendChild(romLink); // DOM interacting w link object
      romLink.click();
      document.body.removeChild(romLink);
      URL.revokeObjectURL(romUrl); // Cleans up object URL
      console.log('ROM download completed.');

      // Readme download if available
      for (const readme of readmesToDownload) {
        const readmeBlob = new Blob([readme.content], { type: 'text/plain' });
        const readmeUrl = URL.createObjectURL(readmeBlob);
        const readmeLink = document.createElement('a');
        readmeLink.href = readmeUrl;
        readmeLink.download = `SquishBGone_Changelog_${readme.filename}_vsStandardFF4UP.txt`;
        document.body.appendChild(readmeLink); 
        readmeLink.click();
        document.body.removeChild(readmeLink);
        URL.revokeObjectURL(readmeUrl);
        console.log(`Downloaded readme file: ${readme.filename}`)
      }

      
    } catch (error) {
      console.error('Error generating ROM for download:', error);
      alert(`Failed to generate patched ROM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isButtonDisabled = disabled || isGenerating;

  return (
    <button
      onClick={handleDownload}
      disabled={isButtonDisabled}
      className={`px-8 py-4
        ${isButtonDisabled
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50 nicer-btn' 
          : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 nicer-btn-blue'
        }
      `}
    >
      <div className="flex items-center p-2">
        {isGenerating ? (
          // Spinner for generating state
          <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          // Download icon
          <svg 
            className="w-5 h-5 mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        )}
        <span>
          {isGenerating 
            ? 'Generating ROM...' 
            : disabled 
              ? 'No Uploaded ROM' 
              : 'Download Patched ROM'
          }
        </span>
      </div>
    </button>
  );
};

export default DownloadRomButton;