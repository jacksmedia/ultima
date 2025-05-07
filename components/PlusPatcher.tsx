'use client';

import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButton from '@/components/DownloadRomButton';
import RomVerifier from '@/components/RomVerifier';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';

type Patch = {
  name: string;
  data: Uint8Array;
  originalName: string; // Store the original filename without path
};

export default function PatchPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchedRom, setPatchedRom] = useState<Uint8Array | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crcInfo, setCrcInfo] = useState<string | null>(null);
  const [loadingPatches, setLoadingPatches] = useState(true);

  // Load and unzip patches only once
  useEffect(() => {
    const loadPatches = async () => {
      try {
        setLoadingPatches(true);
        const response = await fetch('/FF4UP.zip');
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        const patchEntries: Patch[] = [];

        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            
            // Skip directories and non-IPS files
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
              return;
            }
            
            try {
              // Get just the filename without any path
              const originalName = file.name.split('/').pop() || file.name;
              
              // Get IPS patch data as Uint8Array
              const data = new Uint8Array(await file.async('arraybuffer'));
              
              // Verify it's a valid IPS file (should start with "PATCH")
              const header = new TextDecoder().decode(data.slice(0, 5));
              if (header !== 'PATCH') {
                console.warn(`Skipping invalid IPS file: ${file.name} (invalid header: ${header})`);
                return;
              }
              
              // Store the patch name as the filename without extension (for CRC32 matching)
              const nameWithoutExtension = originalName.replace(/\.ips$/i, '').toUpperCase();
              
              patchEntries.push({ 
                name: nameWithoutExtension, 
                data,
                originalName
              });
              
              console.log(`Loaded patch: ${nameWithoutExtension} from ${originalName}`);
            } catch (err) {
              console.error(`Error processing patch file ${file.name}:`, err);
            }
          })
        );

        console.log(`Successfully loaded ${patchEntries.length} IPS patches`);
        setPatches(patchEntries);
      } catch (err) {
        console.error('Failed to load patches:', err);
        setError('Failed to load patch files.');
      } finally {
        setLoadingPatches(false);
      }
    };

    loadPatches();
  }, []);
  
  // current Ultima CRC32
  const EXPECTED_CRC32 = '97C92761';
  
  // Helper to detect and remove SMC/SFC header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    // Check if ROM size is odd (likely has a 512-byte header)
    if (romData.length % 1024 === 512) {
      console.log('ROM header detected, removing 512 bytes');
      return romData.slice(512);
    }
    return romData;
  };

  const handleMatch = async (romFile: File) => {
    setIsPatching(true);
    setError(null);
    setPatchedRom(null);
    setCrcInfo(null);

    try {
      // Load the ROM bytes
      const romBytes = new Uint8Array(await romFile.arrayBuffer());
      
      // Check and remove header if present
      const headerlessRom = removeHeaderIfPresent(romBytes);
      
      // Calculate original ROM CRC32
      const romCRC32 = computeCRC32(headerlessRom);
      
      // Debug log
      console.log(`ROM CRC32: ${romCRC32}`);
      
      // Find matching patch by CRC32
      const matchingPatch = patches.find(patch => patch.name === romCRC32);
      
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }
      
      console.log(`Found matching patch: ${matchingPatch.originalName}`);
      
      // Expand to 2MB if needed
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;
      
      // Apply patch
      const patched = applyIPS(expandedRom, matchingPatch.data);

      // Calculate patched ROM CRC32
      const patchedCRC32 = computeCRC32(patched);
      
      // Debug logging
      setCrcInfo(`Original: ${romCRC32}, Patched: ${patchedCRC32}`);
      console.log(`Patched ROM CRC32: ${patchedCRC32}`);
      console.log(`Expected CRC32: ${EXPECTED_CRC32}`);
      console.log(`CRC32 match: ${patchedCRC32 === EXPECTED_CRC32}`);
      
      if (patchedCRC32 !== EXPECTED_CRC32) {
        console.warn(`CRC32 mismatch: expected ${EXPECTED_CRC32}, got ${patchedCRC32}`);
      }

      setPatchedRom(patched);
    } catch (err: any) {
      console.error('Error during patching:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-3xl font-bold">FF4 Ultima Patcher</h1>
      
      <p className="text-gray-300 max-w-md text-center mb-4">
        Upload your FF4 ROM file to patch it to the Ultima Plus version.
      </p>

      {loadingPatches ? (
        <p>Loading patches...</p>
      ) : patches.length > 0 ? (
        <RomVerifier onMatch={handleMatch} />
      ) : (
        <p className="text-red-500">No patches could be loaded. Please refresh the page.</p>
      )}

      {error && <p className="text-red-500 font-medium">{error}</p>}
      
      {crcInfo && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl mb-2">CRC32 Information:</h2>
          <p className="font-mono">{crcInfo}</p>
        </div>
      )}

      {patchedRom && (
        <DownloadRomButton
          romData={patchedRom}
          filename="FF4 Ultima Plus.sfc"
        />
      )}

      {isPatching && <SpinnerOverlay />}
    </div>
  );
}