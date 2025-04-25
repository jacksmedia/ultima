// lib/zipUtils.ts

import JSZip from 'jszip';

export async function extractIPSFromZip(zipData: ArrayBuffer): Promise<{ name: string; data: Uint8Array }[]> {
  const zip = await JSZip.loadAsync(zipData);
  const ipsFiles: { name: string; data: Uint8Array }[] = [];

  for (const [filename, file] of Object.entries(zip.files)) {
    if (filename.toLowerCase().endsWith('.ips') && !file.dir) {
      const content = await file.async('uint8array');
      ipsFiles.push({ name: filename, data: content });
    }
  }

  return ipsFiles;
}
