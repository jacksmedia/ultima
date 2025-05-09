import React, { useState, useEffect } from 'react';
import ExtensibleRomVerifier, { RomValidationRule } from './ExtensibleRomVerifier';
import ZipExplorer from './ZipExplorer';
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
    <div className="">
      <ZipExplorer />
      {!romFile ? (
        <div className="">
          <p className="">Please upload your FF4 Ultima Plus ROM to customize it with optional features.</p>
          <ExtensibleRomVerifier 
            onValidRom={handleValidRom}
            validationRules={validationRules}
            title="Drop your FF4Ultima ROM here or"
            description="Only accepts FF4 Ultima Plus patched ROMs"
          />
        </div>
      ) : (
        <div className="">
          <div className="">
            <h2 className="">ROM Information</h2>
            {romInfo && (
              <div className="">
                <p><span className="">Name:</span> {romInfo.name}</p>
                <p><span className="">CRC32:</span> {romInfo.crc32}</p>
                <p><span className="">Size:</span> {(romInfo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          <div className="">
            <h2 className="">Optional Features</h2>
            <p className="">Select the optional features you want to apply to your ROM:</p>
            
            <div className="">
              {patchOptions.map(option => (
                <div key={option.id} className="">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={selectedPatches.includes(option.id)}
                    onChange={() => handlePatchToggle(option.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <label htmlFor={option.id} className="">
                      {option.name}
                    </label>
                    <p className="">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="">
            {!isDownloadReady ? (
              <button
                onClick={handleApplyPatches}
                disabled={isProcessing || selectedPatches.length === 0}
                className={`
                  
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
                className=""
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
              className=""
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