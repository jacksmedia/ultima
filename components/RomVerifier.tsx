'use client';

import React, { useState } from 'react';
import { computeCRC32 } from '@/lib/crc32';
import { extractIPSFromZip } from '@/lib/zipUtils';

type Props = {
  patchZip: File; // FF4UP.zip
  onMatch: (romFile: File, matchingPatch: { name: string; data: Uint8Array }) => void;
};

const KNOWN_ROM_HASHES = new Map<string, string>([
  ['65D0A825', 'ff2 v1.0.ips'],
  ['23084FCD', 'ff2 v1.1.ips'],
  ['6CDA700C', 'ff2 v1.0-H.ips'],
  ['CAA15E97', 'ff2 v1.1-H.ips'],
  ['E73564DB', 'ffiv easy.ips'],
  ['A1ED8333', 'ffiv easy-H.ips'],
  ['EE3FBCF2', 'ffiv rev1.1.ips'],
  ['48449269', 'ffiv rev1.1-H.ips'],
]);

export default function RomVerifier({ patchZip, onMatch }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const handleRomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const romFile = event.target.files?.[0];
    if (!romFile) return;

    const romBytes = new Uint8Array(await romFile.arrayBuffer());
    const romCRC = computeCRC32(romBytes);

    if (!KNOWN_ROM_HASHES.has(romCRC)) {
      setStatus(`Unknown ROM CRC32: ${romCRC}. Please upload a valid version.`);
      return;
    }

    setStatus(`ROM verified (CRC32: ${romCRC}). Searching patch...`);

    const patchList = await extractIPSFromZip(await patchZip.arrayBuffer());
    const matchName = KNOWN_ROM_HASHES.get(romCRC);
    const matchingPatch = patchList.find(p => p.name === matchName);

    if (matchingPatch) {
      setStatus(`Patch "${matchName}" matched. Ready to patch!`);
      onMatch(romFile, matchingPatch);
    } else {
      setStatus(`Patch "${matchName}" not found in zip. Please check FF4UP.zip.`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="font-semibold">Upload a ROM for verification:</label>
      <input type="file" accept=".sfc,.smc" onChange={handleRomUpload} />
      {status && <p className="text-sm text-purple-700">{status}</p>}
    </div>
  );
}
