// lib/patcher.ts

export function applyIPS(rom: Uint8Array, patch: Uint8Array): Uint8Array {
  const PATCH_HEADER = 'PATCH';
  const EOF_MARKER = 'EOF';

  const textDecoder = new TextDecoder();
  const header = textDecoder.decode(patch.slice(0, 5));
  if (header !== PATCH_HEADER) {
    throw new Error('Invalid IPS patch: missing PATCH header');
  }

  const romCopy = new Uint8Array(rom); // Don't mutate original ROM
  let offset = 5;

  while (offset < patch.length - 3) {
    // Check for EOF marker
    if (textDecoder.decode(patch.slice(offset, offset + 3)) === EOF_MARKER) {
      break;
    }

    // Read 3-byte offset
    const patchOffset =
      (patch[offset] << 16) | (patch[offset + 1] << 8) | patch[offset + 2];
    offset += 3;

    // Read 2-byte size
    const size = (patch[offset] << 8) | patch[offset + 1];
    offset += 2;

    if (size === 0) {
      // RLE encoding
      const rleSize = (patch[offset] << 8) | patch[offset + 1];
      const rleValue = patch[offset + 2];
      offset += 3;

      for (let i = 0; i < rleSize; i++) {
        if (patchOffset + i < romCopy.length) {
          romCopy[patchOffset + i] = rleValue;
        }
      }
    } else {
      // Normal patch data
      const patchData = patch.slice(offset, offset + size);
      for (let i = 0; i < size; i++) {
        if (patchOffset + i < romCopy.length) {
          romCopy[patchOffset + i] = patchData[i];
        }
      }
      offset += size;
    }
  }

  return romCopy;
}
