import React, { useState, useEffect } from 'react';
import ExtensibleRomVerifier, { RomValidationRule } from './ExtensibleRomVerifier';
import { validateFF4UltimaRom, getAvailablePatchOptions, PatchOption, extractRomInfo, RomInfo } from '@/lib/RomUtilities';
import { applyIpsPatches } from '@/lib/IpsPatcher';

const OptionalPatches: React.FC = () => {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [romInfo, setRomInfo] = useState<RomInfo | null>(null);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [patchOptions, setPatchOptions] = useState<PatchOption[]>([]);

  // Set up validation rules for the ROM verifier
  const validationRules: RomValidationRule[] = [
    {
      validateFile: (file: File, fileData: ArrayBuffer) => validateFF4UltimaRom(file, fileData),
      errorMessage: 'Please upload a valid FF4Ultima patched ROM. The original FF4 ROM must be patched first.'
    }
  ];

  useEffect(() => {
    // Load patch options
    setPatchOptions(getAvailablePatchOptions());
  }, []);

  const handleValidRom = async (file: File) => {
    setRomFile(file);
    const info = await extractRomInfo(file);
    setRomInfo(info);
  };

  const handlePatchToggle = (patchId: string) => {
    setSelectedPatches(prev => {
      if (prev.includes(patchId)) {
        return prev.filter(id => id !== patchId);
      } else {
        return [...prev, patchId];
      }
    });
  };

  const handleApplyPatches = async () => {
    if (!romFile || selectedPatches.length === 0) return;

    setIsProcessing(true);
    try {
      // Get selected patch paths
      const selectedPatchPaths = patchOptions
        .filter(option => selectedPatches.includes(option.id))
        .map(option => option.patchPath);

      // Apply all selected patches!
      const patchedRomData = await applyIpsPatches(romFile, selectedPatchPaths);
      
      // Create download URL
      const blob = new Blob([patchedRomData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setIsDownloadReady(true);
    } catch (error) {
      console.error('Error applying patches:', error);
      alert('Failed to apply patches. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !romFile) return;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `FF4Ultima_Custom_${new Date().getTime()}.sfc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">FF4Ultima Optional Features</h1>
      
      {!romFile ? (
        <div className="mb-8">
          <p className="text-center mb-4">Please upload your FF4Ultima ROM to customize it with optional features.</p>
          <ExtensibleRomVerifier 
            onValidRom={handleValidRom}
            validationRules={validationRules}
            title="Drop your FF4Ultima ROM here"
            description="Only accepts FF4Ultima patched ROMs"
          />
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">ROM Information</h2>
            {romInfo && (
              <div className="text-sm">
                <p><span className="font-medium">Name:</span> {romInfo.name}</p>
                <p><span className="font-medium">CRC32:</span> {romInfo.crc32}</p>
                <p><span className="font-medium">Size:</span> {(romInfo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Optional Features</h2>
            <p className="text-sm text-gray-300 mb-4">Select the optional features you want to apply to your ROM:</p>
            
            <div className="space-y-3">
              {patchOptions.map(option => (
                <div key={option.id} className="flex items-start">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={selectedPatches.includes(option.id)}
                    onChange={() => handlePatchToggle(option.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.name}
                    </label>
                    <p className="text-xs text-gray-400">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {!isDownloadReady ? (
              <button
                onClick={handleApplyPatches}
                disabled={isProcessing || selectedPatches.length === 0}
                className={`
                  px-4 py-2 rounded-lg font-medium
                  ${isProcessing || selectedPatches.length === 0 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-700 hover:bg-blue-800'}
                `}
              >
                {isProcessing ? 'Processing...' : 'Apply Selected Features'}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg font-medium"
              >
                Download Customized ROM
              </button>
            )}
            
            <button
              onClick={() => {
                setRomFile(null);
                setRomInfo(null);
                setSelectedPatches([]);
                setIsDownloadReady(false);
                if (downloadUrl) URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionalPatches;