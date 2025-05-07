import React, { useState } from 'react';
import ExtensibleRomVerifier, { RomValidationRule } from './ExtensibleRomVerifier';
import { validateFF4OriginalRom, extractRomInfo, RomInfo } from '../lib/RomUtilities';
import { applyIpsPatch } from '../lib/IpsPatcher';
import computeCRC32 from '../lib/crc32';

// Define the valid ROM CRC32 checksums
const VALID_ROM_CRCS = ['6CDA700C', '65D0A825', '23084FCD', 'CAA15E97'];

const MainPatcher: React.FC = () => {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [romInfo, setRomInfo] = useState<RomInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPatched, setIsPatched] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Set up validation rules for the ROM verifier
  const validationRules: RomValidationRule[] = [
    {
      validateFile: async (file: File, fileData: ArrayBuffer) => {
        // First verify it's a valid FF4 ROM
        const isValidFF4 = await validateFF4OriginalRom(file, fileData);
        if (!isValidFF4) return false;
        
        // Calculate CRC32 directly from the file data
        const uint8Data = new Uint8Array(fileData);
        const crc32 = computeCRC32(uint8Data);
        
        console.log("Calculated CRC32:", crc32);
        
        // Check if the CRC32 is in our list of valid CRCs
        return VALID_ROM_CRCS.includes(crc32);
      },
      errorMessage: 'Please upload a valid unmodified FF4 ROM with supported CRC32 checksum'
    }
  ];

  const handleValidRom = async (file: File) => {
    setRomFile(file);
    
    // Read the file data to calculate CRC32
    const fileData = await file.arrayBuffer();
    const uint8Data = new Uint8Array(fileData);
    const crc32 = computeCRC32(uint8Data);
    // Create ROM info with the calculated CRC32
    const info = await extractRomInfo(file);
    const enhancedInfo: RomInfo = {
      ...info,
      crc32: crc32
    };
    
    console.log("ROM Info:", enhancedInfo);
    setRomInfo(enhancedInfo);
    
    // Automatically start patching if it's a valid original ROM with supported CRC32
    if (VALID_ROM_CRCS.includes(crc32)) {
      patchRom(file, crc32);
    }
  };

  const patchRom = async (file: File, crc32: string) => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      // Use the CRC32 to determine which IPS patch to apply
      const patchPath = `/FF4UP/${crc32.toUpperCase()}.ips`; // Path to your specific patch based on CRC32
      
      // Apply the appropriate FF4Ultima patch based on CRC32
      const patchedRomData = await applyIpsPatch(file, patchPath);
      
      // Create download URL
      const blob = new Blob([patchedRomData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setIsPatched(true);
    } catch (error) {
      console.error('Error patching ROM:', error);
      alert('Failed to patch ROM. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !romFile) return;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `FF4Ultima_${new Date().getTime()}.sfc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
        {!isPatched ? (
          <div className="mb-8 w-full max-w-md">
            <ExtensibleRomVerifier 
              onValidRom={handleValidRom}
              validationRules={validationRules}
              title="Drop your Final Fantasy IV ROM here"
              description="Only accepts unmodified FF4 ROMs (.sfc, .smc)"
            />
            
            {romInfo && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">ROM Information</h2>
                <p><span className="font-medium">Name:</span> {romInfo.name}</p>
                <p><span className="font-medium">CRC32:</span> {romInfo.crc32}</p>
                <p><span className="font-medium">Size:</span> {(romInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><span className="font-medium">Status:</span> {
                  isProcessing ? 'Processing...' : 
                  VALID_ROM_CRCS.includes(romInfo.crc32) ? 'Valid FF4 ROM' : 
                  'Unsupported FF4 ROM'
                }</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="mb-4 p-6 bg-green-800 rounded-lg">
              <h2 className="text-xl font-bold mb-2">FF4Ultima Patch Applied!</h2>
              <p className="mb-4">Your ROM has been successfully patched with FF4Ultima.</p>
              
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium mb-4 w-full"
              >
                Download Patched ROM
              </button>
            </div>
            
            <button
              onClick={() => {
                setRomFile(null);
                setRomInfo(null);
                setIsPatched(false);
                if (downloadUrl) URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              Patch Another ROM
            </button>
          </div>
        )}
    </div>
  );
};

export default MainPatcher;