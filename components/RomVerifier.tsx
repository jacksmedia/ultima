'use client';

import React, { useState } from 'react';
import { computeCRC32 } from '@/lib/crc32';

type Patch = {
  name: string;
  data: Uint8Array;
};

// .ips filenamess exactly match the CRC32 values; Headered are the 2nd set
// 65D0A825, 23084FCD, 6CDA700C, CAA15E97, E73564DB, A1ED8333, EE3FBCF2, 48449269


type RomVerifierProps = {
  patches: Patch[];
  onMatch: (rom: File, patch: Patch) => void;
};

export default function RomVerifier({ patches, onMatch }: RomVerifierProps) {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'matching' | 'matched' | 'no-match'>('idle');

  const handleRomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRomFile(file);
    setMatchStatus('matching');

    const romBytes = new Uint8Array(await file.arrayBuffer());
    const crc32 = computeCRC32(romBytes);

    // Try to find matching patch
    const matchingPatch = patches.find(patch => patch.name.includes(crc32));

    if (matchingPatch) {
      setMatchStatus('matched');
      onMatch(file, matchingPatch);
    } else {
      setMatchStatus('no-match');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        accept=".sfc,.smc"
        onChange={handleRomUpload}
        className="p-2 border rounded"
      />

      {matchStatus === 'matching' && (
        <p className="text-gray-600">Checking ROM...</p>
      )}
      {matchStatus === 'matched' && (
        <p className="text-green-600 font-semibold">ROM matched! Ready to patch.</p>
      )}
      {matchStatus === 'no-match' && (
        <p className="text-red-600 font-semibold">No matching patch found.</p>
      )}
    </div>
  );
}
