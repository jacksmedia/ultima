// authored by Claude Sonnet 4
import React from 'react';

interface DownloadRomButtonProps {
  romData: Uint8Array | null;
  filename: string;
  disabled?: boolean;
}

const DownloadRomButton: React.FC<DownloadRomButtonProps> = ({ 
  romData, 
  filename, 
  disabled = false 
}) => {
  const handleDownload = () => {
    if (!romData || disabled) return;
    
    const blob = new Blob([romData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !romData}
      className={`
        px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200
        ${disabled || !romData
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
          : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
        }
      `}
    >
      <div className="flex items-center p-2">
        <svg 
          className="w-5 h-5" 
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
        <span>
          {disabled || !romData ? 'No Uploaded ROM' : 'Download Patched ROM'}
        </span>
      </div>
    </button>
  );
};

export default DownloadRomButton;