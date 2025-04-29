import React from 'react';

interface DownloadRomButtonProps {
  romData: Uint8Array;
  filename: string;
}

const DownloadRomButton: React.FC<DownloadRomButtonProps> = ({ romData, filename }) => {
  const handleDownload = () => {
    if (romData.length < 2097152) {
      alert(`Warning: ROM is smaller than expected (${romData.length} bytes)`);
      return;
    }

    const blob = new Blob([romData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <button onClick={handleDownload} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
      Download Patched ROM
    </button>
  );
};

export default DownloadRomButton;
