// lib/patcher.ts

export async function applyIPS(romData: Uint8Array, ipsData: Uint8Array): Promise<Uint8Array> {
  const IPS_HEADER = "PATCH";
  const IPS_FOOTER = "EOF";

  let offset = 5; // Skip 'PATCH' header
  if (new TextDecoder().decode(ipsData.slice(0, 5)) !== IPS_HEADER) {
    throw new Error("Invalid IPS file: Incorrect header.");
  }

  while (offset < ipsData.length) {
    if (new TextDecoder().decode(ipsData.slice(offset, offset + 3)) === IPS_FOOTER) {
      return romData;
    }

    const address = (ipsData[offset] << 16) | (ipsData[offset + 1] << 8) | ipsData[offset + 2];
    offset += 3;
    const size = (ipsData[offset] << 8) | ipsData[offset + 1];
    offset += 2;

    if (size === 0) {
      const rleSize = (ipsData[offset] << 8) | (ipsData[offset + 1]);
      const value = ipsData[offset + 2];
      offset += 3;

      // Always reassign the possibly expanded ROM
      romData = expandRomIfNeeded(romData, address + rleSize);
      romData.fill(value, address, address + rleSize);
    } else {
      romData = expandRomIfNeeded(romData, address + size);
      romData.set(ipsData.slice(offset, offset + size), address);
      offset += size;
    }
  }

  throw new Error("Invalid IPS file: Missing EOF footer.");
}


// Expands the ROM if needed
function expandRomIfNeeded(rom: Uint8Array, neededSize: number): Uint8Array {
  if (rom.length >= neededSize) {
    return rom;
  }
  console.log(`Expanding ROM from ${rom.length} bytes to ${neededSize} bytes`);
  const expandedRom = new Uint8Array(neededSize);
  expandedRom.set(rom);
  return expandedRom;
}
