// PlusPatcher.tsx — zip-free rewrite: all patch lists from build-time static props
import React, { useMemo, useState } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButton from '@/components/DownloadRomButton';
import RomVerifier from '@/components/RomVerifier';
import StylesPanel, { StylePatch, PatchCategory as StyleCategory } from '@/components/StylesPanel';
import CustomOptionsPanel, { OptionalPatch, PatchCategory as OptionalCategory } from '@/components/CustomOptionsPanel';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import PlusTitle from '@/components/PlusTitle';

// Manifest shape written by generatePatches.js
export type ExtractedManifest = {
  basePlus: string[];
  baseClassic: string[];
  styles: string[];
  battles: string[];
  maps: string[];
  portraits: string[];
  fonts: string[];
  tweaks: string[];
};

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

// Mirror the display-name logic from useZipPatches
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

function buildOptionalCategory(
  filenames: string[],
  categoryId: string,
  title: string,
  description: string,
  allowMultiple: boolean
): OptionalCategory {
  const patches: OptionalPatch[] = filenames.map(filename => ({
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

// Fetch and apply a single .ips file from /extracted/{subdir}/{filename}
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

export default function PlusPatcher({ manifest }: { manifest: ExtractedManifest }) {
  const [romState, setRomState] = useState<RomState | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStylePatches, setSelectedStylePatches] = useState<string[]>([]);
  const [selectedOptionalPatches, setSelectedOptionalPatches] = useState<string[]>([]);

  // Build base patch list from manifest — instant, no zip loading
  const patches: Patch[] = useMemo(() =>
    manifest.basePlus.map(filename => ({
      name: filename.replace(/\.ips$/i, '').toUpperCase(),
      originalName: filename,
    })),
    [manifest.basePlus]
  );

  // Build style categories from manifest
  const styleCategories: StyleCategory[] = useMemo(() => [
    buildStyleCategory(manifest.styles, 'styles', 'Styles', 'Changes to many graphics', false),
  ], [manifest.styles]);

  // Build optional categories from manifest
  const optionalCategories: OptionalCategory[] = useMemo(() => [
    buildOptionalCategory(manifest.battles,  'battles',  'Battle Sprites',   'Changes hero graphics in battle',        false),
    buildOptionalCategory(manifest.maps,     'maps',     'Map Sprites',      "Changes the heroes' map avatars",         false),
    buildOptionalCategory(manifest.portraits,'portraits','Portraits',         'Changes the hero faces in the menu',      false),
    buildOptionalCategory(manifest.tweaks,   'tweaks',   'Game Adjustments', 'Tweaks to the battle or menu systems',    true),
    buildOptionalCategory(manifest.fonts,    'fonts',    'Alt Fonts (+ Item Names)', 'Alternate Fonts, + Alt. Item Names with SBG', false),
  ], [manifest.battles, manifest.maps, manifest.portraits, manifest.tweaks, manifest.fonts]);

  // Helper: look up selected patch objects by ID
  const getSelectedFrom = <T extends { id: string }>(categories: { patches: T[] }[], ids: string[]): T[] => {
    const all = categories.flatMap(c => c.patches);
    return ids.map(id => all.find(p => p.id === id)).filter((p): p is T => !!p);
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

      // Instant lookup against static manifest — no zip download needed
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

  const generatePatchedRom = async (): Promise<{
    patchedRom: Uint8Array;
    readmesToDownload: { filename: string; content: string }[];
  }> => {
    if (!romState) throw new Error('No ROM loaded');

    let patchedRom = new Uint8Array(romState.processedRom.buffer);
    const readmesToDownload: { filename: string; content: string }[] = [];

    // Fetch + apply base patch (one small .ips file, not the whole zip)
    patchedRom = await fetchAndApply(patchedRom, 'base-plus', romState.matchingPatch.originalName);

    // Fetch + apply selected style patches
    const selectedStyles = getSelectedFrom(styleCategories, selectedStylePatches);
    for (const patch of selectedStyles) {
      patchedRom = await fetchAndApply(patchedRom, 'styles', patch.filename);

      if (patch.filename.includes('SBG')) {
        try {
          const readmeFilename = patch.filename.replace(/\.ips$/i, '.txt');
          const readmeRes = await fetch(`/readmes/${readmeFilename}`);
          if (readmeRes.ok) {
            readmesToDownload.push({ filename: readmeFilename, content: await readmeRes.text() });
          }
        } catch { /* non-critical */ }
      }
    }

    // Fetch + apply selected optional patches
    const selectedOptionals = getSelectedFrom(optionalCategories, selectedOptionalPatches);
    for (const patch of selectedOptionals) {
      patchedRom = await fetchAndApply(patchedRom, patch.category ?? patch.id.split('-')[0], patch.filename);

      if (patch.filename.includes('SBG')) {
        try {
          const readmeFilename = patch.filename.replace(/\.ips$/i, '.txt');
          const readmeRes = await fetch(`/readmes/${readmeFilename}`);
          if (readmeRes.ok) {
            readmesToDownload.push({ filename: readmeFilename, content: await readmeRes.text() });
          }
        } catch { /* non-critical */ }
      }
    }

    return { patchedRom, readmesToDownload };
  };

  const hasValidRom = romState !== null;

  return (
    <>
      {/* Title + download */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='flex-col justify-center items-center'>
          <PlusTitle />
          <h5>
            <a href="Final Fantasy IV Ultima Plus changelog.txt" rel="noopener noreferrer" target="_blank">
              Version 1.1
            </a>, December 2025
          </h5>
          <DownloadRomButton
            onGenerateRom={generatePatchedRom}
            filename={`FF4 Ultima Plus${selectedOptionalPatches.length > 0 ? ' Custom' : ''}.sfc`}
            disabled={!hasValidRom || isPatching}
          />
        </div>

        <div className='flex-col justify-center items-center'>
          {/* RomVerifier is ready immediately — no zip loading required */}
          <RomVerifier onMatch={handleMatch} />
          <p className="text-center">
            Upload your FFII or FFIV ROM file to create a copy of FF4 Ultima Plus.<br />
            Choose a new visual style, or pick and choose<br />alternate graphics & a new font if you wish!
          </p>
        </div>
      </div>

      {/* Styles & Optional Patches — always ready, populated from static props */}
      <div className='flex-col justify-center items-center'>
        <StylesPanel
          categories={styleCategories}
          selectedPatches={selectedStylePatches}
          onSelectionChange={setSelectedStylePatches}
          isDisabled={isPatching || !hasValidRom}
        />
        <h4>Styles are meant to be used without extra Options.</h4>
        <p>Feel free to experiment, yet keep in mind they are not supported together.</p>
        <CustomOptionsPanel
          categories={optionalCategories}
          selectedPatches={selectedOptionalPatches}
          onSelectionChange={setSelectedOptionalPatches}
          isDisabled={isPatching || !hasValidRom}
        />

        {error && <p className="text-red-500 font-medium">{error}</p>}

        {hasValidRom && (
          <div className="p-4 bg-black rounded-lg">
            <h2 className="text-xl mb-2">ROM Ready:</h2>
            <p className="font-mono text-sm">Uploaded CRC32: {romState!.originalCRC32}</p>
            {selectedOptionalPatches.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-300">Selected patches:</p>
                <ul className="text-xs text-gray-400 mt-1">
                  {getSelectedFrom(styleCategories, selectedStylePatches).map(p => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
                <ul className="text-xs text-gray-400 mt-1">
                  {getSelectedFrom(optionalCategories, selectedOptionalPatches).map(p => (
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
