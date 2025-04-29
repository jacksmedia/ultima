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
};

export default function PatchPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchedRom, setPatchedRom] = useState<Uint8Array | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crcInfo, setCrcInfo] = useState<string | null>(null);

  // Load and unzip patches only once
  useEffect(() => {
    const loadPatches = async () => {
      try {
        const response = await fetch('/FF4UP.zip');
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        const patchEntries: Patch[] = [];

        await Promise.all(
          Object.values(zip.files).map(async (file) => {
            if (file.name.endsWith('.ips')) {
              const data = new Uint8Array(await file.async('arraybuffer'));
              patchEntries.push({ name: file.name.toUpperCase(), data });
            }
          })
        );

        setPatches(patchEntries);
      } catch (err) {
        console.error('Failed to load patches:', err);
        setError('Failed to load patch files.');
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

  const handleMatch = async (romFile: File, patch: Patch) => {
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
      const originalCRC32 = computeCRC32(headerlessRom);
      
      // Debug log
      console.log(`Original ROM CRC32: ${originalCRC32}`);
      
      // Expand to 2MB if needed
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;
      
      // Apply patch
      const patched = applyIPS(expandedRom, patch.data);

      // Calculate patched ROM CRC32
      const patchedCRC32 = computeCRC32(patched);
      
      // Debug logging
      setCrcInfo(`Expected: ${EXPECTED_CRC32}, Got: ${patchedCRC32}`);
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

      {patches.length > 0 ? (
        <RomVerifier patches={patches} onMatch={handleMatch} />
      ) : (
        <p>Loading patches...</p>
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