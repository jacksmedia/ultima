import crc32 from 'crc-32';

/**
 * Computes an 8-character uppercase CRC32 hash for ROM data
 * @param data - The ROM file data as Uint8Array
 * @returns An 8-character uppercase hexadecimal CRC32 hash
 */
const computeCRC32 = (data: Uint8Array): string => {
  // Calculate CRC32
  const crcValue = crc32.buf(data);
  
  // Convert to unsigned 32-bit integer (CRC32 can be negative)
  const unsignedCrc = crcValue >>> 0;
  
  // Convert to 8-character uppercase hex string with zero padding
  return unsignedCrc.toString(16).padStart(8, '0').toUpperCase();
};

export default computeCRC32;