// components/PatchButton.tsx
'use client';

import React, { useState } from 'react';
import { applyIPS } from '@/lib/patcher';
import { computeCRC32 } from '@/lib/crc32';

type Props = {
  romFile: File | null;
  patchFiles: File[];
};

export default function PatchButton({ romFile, patchFiles }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const handlePatch = async () => {
    if (!romFile || patchFiles.length === 0) {
      setStatus('Please upload both a ROM and at least one patch.');
      return;
    }

    const romData = new Uint8Array(await romFile.arrayBuffer());

    for (const patchFile of patchFiles) {
      const patchData = new Uint8Array(await patchFile.arrayBuffer());
      const patchedROM = applyIPS(romData, patchData);
      const crc = computeCRC32(patchedROM);
      const outName = romFile.name.replace(/\.sfc|\.smc/i, '') + `-${patchFile.name.replace(/\.ips/i, '')}-${crc}.sfc`;

      downloadBinary(patchedROM, outName);
    }

    setStatus('Patched ROM(s) downloaded successfully!');
  };

  const downloadBinary = (data: Uint8Array, filename: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handlePatch}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Patches & Download
      </button>
      {status && <p className="text-sm text-green-600">{status}</p>}
    </div>
  );
}
