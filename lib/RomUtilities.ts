import { crc32 } from 'crc';

export interface RomInfo {
  name: string;
  crc32: string;
  size: number;
  type: 'original' | 'patched' | 'unknown';
}

export interface PatchOption {
  id: string;
  name: string;
  description: string;
  patchPath: string;
  required?: boolean;
}

// ROM validation functions
export const validateFF4OriginalRom = async (file: File, fileData: ArrayBuffer): Promise<boolean> => {
  const expectedCrc32 = '1F373E00'; // FF4 original ROM CRC32 (hexadecimal)
  const calculatedCrc32 = calculateCrc32(fileData).toUpperCase();
  return calculatedCrc32 === expectedCrc32;
};

export const validateFF4UltimaRom = async (file: File, fileData: ArrayBuffer): Promise<boolean> => {
  const expectedCrc32 = 'A7654321'; // Replace with actual FF4Ultima ROM CRC32
  const calculatedCrc32 = calculateCrc32(fileData).toUpperCase();
  return calculatedCrc32 === expectedCrc32;
};


// Calculates CRC32 from ArrayBuffer
export const calculateCrc32 = (data: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(data);
  const checksum = crc32(uint8Array.buffer);
  return checksum.toString(16).padStart(8, '0');
};

// Extract ROM information from file
export const extractRomInfo = async (file: File): Promise<RomInfo> => {
  const fileData = await file.arrayBuffer();
  const uint8Array = new Uint8Array(fileData);
  const checksum = crc32(uint8Array.buffer);
  const crc32Hex = checksum.toString(16).padStart(8, '0').toUpperCase();
  
  let type: 'original' | 'patched' | 'unknown' = 'unknown';
  
  // Determine ROM type based on CRC32
  const originalCRCs = ['65D0A825', '23084FCD', '6CDA700C', 'CAA15E97'];
  if (originalCRCs.includes(crc32Hex)) {
    type = 'original';
  } else if (crc32Hex === '1F373E00') { // Replace with actual FF4Ultima ROM CRC32
    type = 'patched';
  }
  
  return {
    name: file.name,
    crc32: crc32Hex,
    size: file.size,
    type
  };
};

// Example optional patch options for FF4Ultima
export const getAvailablePatchOptions = (): PatchOption[] => {
  return [
    {
      id: 'Mercury',
      name: 'Mercury Style',
      description: 'classic battle sprites, new colors',
      patchPath: '/patches/Mercury-Plus.ips',
    },
    {
      id: 'Mars',
      name: 'Mars Style',
      description: 'PR battle sprites, some new colors',
      patchPath: '/patches/Mars-Plus.ips',
    },
    {
      id: 'Vesta',
      name: 'Vesta Style',
      description: 'classic battle sprites, new colors',
      patchPath: '/patches/Vesta-Plus.ips',
    },
    {
      id: 'Neptune',
      name: 'Neptune Style',
      description: 'classic battle sprites, new colors',
      patchPath: '/patches/Neptune-Plus.ips',
    }
  ];
};