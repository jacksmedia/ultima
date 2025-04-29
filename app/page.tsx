'use client';

import React, { useState, useEffect } from 'react';
import RomVerifier from '@/components/RomVerifier';
import PatchButton from '@/components/PatchButton';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { applyIPS } from '@/lib/patcher';
import { extractIPSFromZip } from '@/lib/zipUtils';

export default function HomePage() {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [patches, setPatches] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load the patch bundle ONCE when page loads
  useEffect(() => {
    const loadPatchZip = async () => {
      const response = await fetch('/FF4UP.zip');
      const arrayBuffer = await response.arrayBuffer();
      const extractedPatches = await extractIPSFromZip(arrayBuffer);
      setPatches(extractedPatches);
    };

    loadPatchZip();
  }, []);

  const handleRomVerified = async (rom: File, patch: { name: string; data: Uint8Array }) => {
    setRomFile(rom);
    setPatchFile(new File([patch.data], patch.name));
  };

  const handlePatchClick = async () => {
    if (!romFile || !patchFile) return;

    setIsProcessing(true);

    const romBytes = new Uint8Array(await romFile.arrayBuffer());
    const patchBytes = new Uint8Array(await patchFile.arrayBuffer());

    const patchedRom = await applyIPS(romBytes, patchBytes);
    // Logging patched ROM size for secure performance
    console.log(`Patched ROM size: ${patchedRom.length} bytes (${(patchedRom.length / (1024 * 1024)).toFixed(2)} MB)`);


    const patchedBlob = new Blob([patchBytes], { type: 'application/octet-stream' });
    const patchedUrl = URL.createObjectURL(patchedBlob);

    const a = document.createElement('a');
    a.href = patchedUrl;
    a.download = `patched-${romFile.name}`;
    a.click();

    URL.revokeObjectURL(patchedUrl);
    setIsProcessing(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-4">FF4 Ultima Patcher</h1>

      {/* all patched onboad in /public/FF4UP.zip */}
      <RomVerifier
        patches={patches}
        onMatch={handleRomVerified}
      />

      <PatchButton
        romFile={romFile}
        patchFile={patchFile}
        onPatch={handlePatchClick}
        disabled={!romFile || !patchFile}
      />


      {isProcessing && <SpinnerOverlay />}
    </main>
  );
}
