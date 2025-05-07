/**
 * Utility functions for applying IPS patches to ROM files
 */

// Apply a single IPS patch to a ROM file
export const applyIpsPatch = async (
  romFile: File, 
  patchPath: string
): Promise<ArrayBuffer> => {
  // Load the ROM file as an ArrayBuffer
  const romData = await romFile.arrayBuffer();
  
  // Fetch the IPS patch file
  const patchResponse = await fetch(patchPath);
  if (!patchResponse.ok) {
    throw new Error(`Failed to fetch patch: ${patchResponse.statusText}`);
  }
  const patchData = await patchResponse.arrayBuffer();
  
  // Apply the patch
  return applyIpsPatchToBuffer(romData, patchData);
};

// Apply multiple IPS patches sequentially to a ROM file
export const applyIpsPatches = async (romFile: File, patchPaths: string[]): Promise<ArrayBuffer> => {
  let currentRomData = await romFile.arrayBuffer();
  
  // Apply each patch sequentially
  for (const patchPath of patchPaths) {
    const patchResponse = await fetch(patchPath);
    if (!patchResponse.ok) {
      throw new Error(`Failed to fetch patch: ${patchResponse.statusText}`);
    }
    const patchData = await patchResponse.arrayBuffer();
    
    // Apply this patch to the current ROM data
    currentRomData = applyIpsPatchToBuffer(currentRomData, patchData);
  }
  
  return currentRomData;
};

// Apply an IPS patch to a ROM buffer
const applyIpsPatchToBuffer = (romBuffer: ArrayBuffer, patchBuffer: ArrayBuffer): ArrayBuffer => {
  const romView = new Uint8Array(romBuffer);
  const patchView = new Uint8Array(patchBuffer);
  
  // Create a new buffer for the patched ROM (may need to grow if patch extends ROM)
  let patchedRom = new Uint8Array(romView.length);
  patchedRom.set(romView); // Copy original ROM data
  
  // Check for "PATCH" header (IPS format)
  if (String.fromCharCode(...patchView.slice(0, 5)) !== 'PATCH') {
    throw new Error('Invalid IPS patch format');
  }
  
  // Start after the header
  let offset = 5;
  
  while (offset < patchView.length - 3) {
    // Check for EOF marker "EOF" (0x45, 0x4F, 0x46)
    if (patchView[offset] === 0x45 && 
        patchView[offset + 1] === 0x4F && 
        patchView[offset + 2] === 0x46) {
      break;
    }
    
    // Read address (3 bytes)
    const address = (patchView[offset] << 16) | 
                    (patchView[offset + 1] << 8) | 
                    patchView[offset + 2];
    offset += 3;
    
    // Read size (2 bytes)
    const size = (patchView[offset] << 8) | patchView[offset + 1];
    offset += 2;
    
    if (size === 0) {
      // RLE encoding
      const rleSize = (patchView[offset] << 8) | patchView[offset + 1];
      offset += 2;
      const rleByte = patchView[offset];
      offset += 1;
      
      // Ensure our buffer can fit the expanded ROM if needed
      if (address + rleSize > patchedRom.length) {
        const newBuffer = new Uint8Array(address + rleSize);
        newBuffer.set(patchedRom);
        patchedRom = newBuffer;
      }
      
      // Fill with the RLE byte
      for (let i = 0; i < rleSize; i++) {
        patchedRom[address + i] = rleByte;
      }
    } else {
      // Normal encoding - copy the bytes
      
      // Ensure our buffer can fit the expanded ROM if needed
      if (address + size > patchedRom.length) {
        const newBuffer = new Uint8Array(address + size);
        newBuffer.set(patchedRom);
        patchedRom = newBuffer;
      }
      
      // Copy patch data to ROM
      for (let i = 0; i < size; i++) {
        patchedRom[address + i] = patchView[offset + i];
      }
      offset += size;
    }
  }
  
  return patchedRom.buffer;
};