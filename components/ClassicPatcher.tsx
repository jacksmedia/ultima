// ClassicPatcher.tsx — zip-free rewrite: patch lists from build-time static props
import React, { useMemo, useState } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButtonClassic from '@/components/DownloadRomButtonClassic';
import RomVerifier from '@/components/RomVerifier';
import StylesPanel, { StylePatch, PatchCategory as StyleCategory } from '@/components/StylesPanel';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import ClassicTitle from '@/components/ClassicTitle';
import { ExtractedManifest } from '@/components/PlusPatcher';

type Patch = {
  name: string;         // CRC32 uppercase — used for matching
  originalName: string; // e.g. "CAA15E97.ips"
};

type RomState = {
  originalFile: File;
  processedRom: Uint8Array;
  matchingPatch: Patch;
  originalCRC32: string;
};

function toDisplayName(filename: string): string {
  return filename
    .replace(/\.ips$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function buildStyleCategory(
  filenames: string[],
  categoryId: string,
  title: string,
  description: string,
  allowMultiple: boolean
): StyleCategory {
  const patches: StylePatch[] = filenames.map(filename => ({
    id: `${categoryId}-${filename}`,
    name: toDisplayName(filename),
    description: `Apply ${toDisplayName(filename)} modifications`,
    filename,
    data: new Uint8Array(0), // fetched lazily at download time
    category: categoryId,
    previewImage: `/previews/${filename.replace(/\.ips$/i, '')}.png`,
  }));
  return { id: categoryId, title, description, patches, allowMultiple };
}

async function fetchAndApply(
  rom: Uint8Array,
  subdir: string,
  filename: string
): Promise<Uint8Array> {
  const url = `/extracted/${subdir}/${encodeURIComponent(filename)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch patch: ${filename}`);
  return applyIPS(rom, new Uint8Array(await res.arrayBuffer())) as Uint8Array;
}

export default function ClassicPatcher({ manifest }: { manifest: ExtractedManifest }) {
  const [romState, setRomState] = useState<RomState | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStylePatches, setSelectedStylePatches] = useState<string[]>([]);
  const [selectedOptionalPatches] = useState<string[]>([]); // kept for filename logic only

  // Build base patch list from manifest — instant, no zip loading
  const patches: Patch[] = useMemo(() =>
    manifest.baseClassic.map(filename => ({
      name: filename.replace(/\.ips$/i, '').toUpperCase(),
      originalName: filename,
    })),
    [manifest.baseClassic]
  );

  // Build style categories from manifest
  const styleCategories: StyleCategory[] = useMemo(() => [
    buildStyleCategory(manifest.styles, 'styles', 'Styles', 'Changes to many graphics', false),
  ], [manifest.styles]);

  const getSelectedStyles = (ids: string[]): StylePatch[] => {
    const all = styleCategories.flatMap(c => c.patches);
    return ids.map(id => all.find(p => p.id === id)).filter((p): p is StylePatch => !!p);
  };

  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) return romData.slice(512);
    return romData;
  };

  const handleMatch = async (romFile: File) => {
    setIsPatching(true);
    setError(null);
    setRomState(null);

    try {
      const arrayBuffer = await romFile.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer);
      const headerlessRom = removeHeaderIfPresent(romBytes);
      const romCRC32 = computeCRC32(headerlessRom);

      const matchingPatch = patches.find(p => p.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }

      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => { const r = new Uint8Array(2 * 1024 * 1024); r.set(headerlessRom); return r; })()
        : headerlessRom;

      setRomState({ originalFile: romFile, processedRom: expandedRom, matchingPatch, originalCRC32: romCRC32 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  const generatePatchedRom = async (): Promise<Uint8Array> => {
    if (!romState) throw new Error('No ROM loaded');

    let patchedRom = new Uint8Array(romState.processedRom.buffer);

    // Fetch + apply base classic patch
    patchedRom = await fetchAndApply(patchedRom, 'base-classic', romState.matchingPatch.originalName);

    // Fetch + apply selected style patches
    const selectedStyles = getSelectedStyles(selectedStylePatches);
    for (const patch of selectedStyles) {
      patchedRom = await fetchAndApply(patchedRom, 'styles', patch.filename);
    }

    return patchedRom;
  };

  const hasValidRom = romState !== null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className='flex-col justify-center items-center'>
          <ClassicTitle />
          <h5>
            <a href="Final Fantasy IV Ultima changelog.txt" rel="noopener noreferrer" target="_blank">
              See changelog
            </a>
          </h5>
          <DownloadRomButtonClassic
            onGenerateRom={generatePatchedRom}
            filename={`FF4 Ultima${selectedOptionalPatches.length > 0 ? ' Custom' : ''}.sfc`}
            disabled={!hasValidRom || isPatching}
          />
        </div>

        <div className='flex-col justify-center items-center'>
          {/* RomVerifier is ready immediately — no zip loading required */}
          <RomVerifier onMatch={handleMatch} />
          <p className="text-center mb-2">
            Upload your FFII or FFIV ROM file to create a copy of FF4 Ultima.<br />
            Choose a new visual style if you wish!<br />
            <em>(Note: RetroAchievements doesn't support Styles.)</em>
          </p>
        </div>
      </div>

      {/* Styles panel — always ready, populated from static props */}
      <div className='flex justify-center items-center'>
        <StylesPanel
          categories={styleCategories}
          selectedPatches={selectedStylePatches}
          onSelectionChange={setSelectedStylePatches}
          isDisabled={isPatching || !hasValidRom}
        />

        {hasValidRom && (
          <div className="p-4 bg-black rounded-lg">
            <h2 className="text-xl mb-2">ROM Ready:</h2>
            <p className="font-mono text-sm">Uploaded CRC32: {romState!.originalCRC32}</p>
            {selectedStylePatches.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-300">Selected patches:</p>
                <ul className="text-xs text-gray-400 mt-1">
                  {getSelectedStyles(selectedStylePatches).map(p => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isPatching && <SpinnerOverlay />}
      </div>
    </>
  );
}
