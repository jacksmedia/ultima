// app/page.tsx
'use client';

import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { applyIPS } from '@/lib/patcher';
import { extractIPSFromZip } from '@/lib/zipUtils';
import { computeCRC32 } from '@/lib/crc32';



export default function HomePage() {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFiles, setPatchFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleROMUpload = (file: File) => setRomFile(file);
  const handlePatchUpload = (files: File[]) => setPatchFiles(files);

  const zipBuffer = await someZipFile.arrayBuffer();
  const patches = await extractIPSFromZip(zipBuffer);

  const patchedRom = applyIPS(romBytes, patchBytes);
  // patches[0].name → filename
  // patches[0].data → Uint8Array for patching

  const checksum = computeCRC32(romBytes);
  // checksum → "A1B2C3D4"


  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">FF4 Ultima Patcher</h1>

      <FileUploader
        onROMUpload={handleROMUpload}
        onPatchUpload={handlePatchUpload}
      />


      {/* You can add buttons here later to trigger patching */}
      {isProcessing && <SpinnerOverlay />}
    </main>
  );
}
