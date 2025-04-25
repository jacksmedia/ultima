// lib/crc32.ts

// Precompute the CRC table once
const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return c >>> 0;
});

export function computeCRC32(data: Uint8Array): string {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const tableIndex = (crc ^ byte) & 0xFF;
    crc = (crc >>> 8) ^ crcTable[tableIndex];
  }

  // Finalize and convert to 8-char hex string
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}
