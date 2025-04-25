'use client';

import React, { useState } from 'react';
import RomVerifier from '@/components/RomVerifier';
import PatchButton from '@/components/PatchButton';
import SpinnerOverlay from '@/components/SpinnerOverlay';

export default function HomePage() {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFiles, setPatchFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);


  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-3xl font-bold">FF4 Ultima Patcher</h1>

      <label className="text-lg font-semibold">Upload Patch Archive (.zip):</label>
      <input
        type="file"
        accept=".zip"
        onChange={(e) => {
          const zip = e.target.files?.[0] || null;
          setZipFile(zip);
        }}
      />

      {zipFile && (
        <RomVerifier
          patchZip={zipFile}
          onMatch={(rom, patch) => {
            setRomFile(rom);
            setPatchFiles([new File([patch.data], patch.name)]);
          }}
        />
      )}

      {romFile && patchFiles.length > 0 && (
        <PatchButton
          romFile={romFile}
          patchFiles={patchFiles}
          isProcessing={isProcessing}
        />
      )}

      {isProcessing && <SpinnerOverlay />}
    </main>
  );
}
