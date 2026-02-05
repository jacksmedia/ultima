// Ulti Patcher - modular patch selection with config recipes
import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { useZipPatches, ZipPatch } from '@/hooks/useZipPatches';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import BothTitles from '@/components/BothTitles';

type MainPatch = {
  name: string;
  data: Uint8Array;
  originalName: string;
};

type RomState = {
  originalFile: File;
  processedRom: Uint8Array;
  matchingPatch: MainPatch;
  originalCRC32: string;
};

type PatchConfig = {
  battles: string | null;
  maps: string | null;
  portraits: string | null;
  tweaks: string[];
};

const Ulti: React.FC = () => {
  // Main patches for CRC matching
  const [mainPatches, setMainPatches] = useState<MainPatch[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);

  // ROM state
  const [romState, setRomState] = useState<RomState | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patch selections (4 modular categories)
  const [patchConfig, setPatchConfig] = useState<PatchConfig>({
    battles: null,
    maps: null,
    portraits: null,
    tweaks: []
  });

  // Load patches from ZIP files using unified hook
  const battlesConfig = useMemo(() => ({
    categories: [{
      id: 'battles',
      title: 'Battle Sprites',
      description: 'Changes hero graphics in battle',
      allowMultiple: false,
      zipFile: 'Battles.zip'
    }]
  }), []);

  const mapsConfig = useMemo(() => ({
    categories: [{
      id: 'maps',
      title: 'Map Sprites',
      description: 'Changes the heroes\' map avatars',
      allowMultiple: false,
      zipFile: 'Maps.zip'
    }]
  }), []);

  const portraitsConfig = useMemo(() => ({
    categories: [{
      id: 'portraits',
      title: 'Portraits',
      description: 'Changes the hero faces in the menu',
      allowMultiple: false,
      zipFile: 'Portraits.zip'
    }]
  }), []);

  const tweaksConfig = useMemo(() => ({
    categories: [{
      id: 'tweaks',
      title: 'Game Adjustments',
      description: 'Tweaks to the battle or menu systems',
      allowMultiple: true,
      zipFile: 'Tweaks.zip'
    }]
  }), []);

  const { categories: battlesCategories, loading: loadingBattles } = useZipPatches(battlesConfig);
  const { categories: mapsCategories, loading: loadingMaps } = useZipPatches(mapsConfig);
  const { categories: portraitsCategories, loading: loadingPortraits } = useZipPatches(portraitsConfig);
  const { categories: tweaksCategories, loading: loadingTweaks } = useZipPatches(tweaksConfig);

  // Extract patches from categories
  const battlesPatches = battlesCategories[0]?.patches || [];
  const mapsPatches = mapsCategories[0]?.patches || [];
  const portraitsPatches = portraitsCategories[0]?.patches || [];
  const tweaksPatches = tweaksCategories[0]?.patches || [];

  const loadingPatches = loadingBattles || loadingMaps || loadingPortraits || loadingTweaks;

  // Load main patches for CRC matching
  useEffect(() => {
    const loadMainPatches = async () => {
      try {
        setLoadingMain(true);
        const response = await fetch('/FF4UP.zip');
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        const patches: MainPatch[] = [];

        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) return;

            try {
              const originalName = file.name.split('/').pop() || file.name;
              const data = new Uint8Array(await file.async('arraybuffer'));
              const header = new TextDecoder().decode(data.slice(0, 5));
              if (header !== 'PATCH') return;

              const nameWithoutExtension = originalName.replace(/\.ips$/i, '').toUpperCase();
              patches.push({ name: nameWithoutExtension, data, originalName });
            } catch (err) {
              console.error(`Error loading patch ${filename}:`, err);
            }
          })
        );

        setMainPatches(patches);
      } catch (err) {
        console.error('Failed to load main patches:', err);
        setError('Failed to load main patch files.');
      } finally {
        setLoadingMain(false);
      }
    };

    loadMainPatches();
  }, []);

  // Remove ROM copier header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) {
      return romData.slice(512);
    }
    return romData;
  };

  // Handle ROM upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPatching(true);
    setError(null);
    setRomState(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer);
      const headerlessRom = removeHeaderIfPresent(romBytes);
      const romCRC32 = computeCRC32(headerlessRom);

      const matchingPatch = mainPatches.find(patch => patch.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }

      // Expand ROM to 2MB
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;

      setRomState({
        originalFile: file,
        processedRom: expandedRom,
        matchingPatch,
        originalCRC32: romCRC32
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process ROM file.');
    } finally {
      setIsPatching(false);
    }
  };

  // Handle patch selection for single-select categories
  const handleSingleSelect = (category: 'battles' | 'maps' | 'portraits', patchId: string) => {
    setPatchConfig(prev => ({
      ...prev,
      [category]: prev[category] === patchId ? null : patchId
    }));
  };

  // Handle patch selection for multi-select (tweaks)
  const handleTweakToggle = (patchId: string) => {
    setPatchConfig(prev => ({
      ...prev,
      tweaks: prev.tweaks.includes(patchId)
        ? prev.tweaks.filter(id => id !== patchId)
        : [...prev.tweaks, patchId]
    }));
  };

  // Generate and download patched ROM
  const handleDownload = async () => {
    if (!romState) return;

    setIsPatching(true);
    try {
      let patchedRom = new Uint8Array(romState.processedRom);

      // Apply main patch first
      patchedRom = applyIPS(patchedRom, romState.matchingPatch.data as Uint8Array) as Uint8Array<ArrayBuffer>;

      // Helper to find and apply patch by ID
      const applyPatchById = (patches: ZipPatch[], patchId: string | null) => {
        if (!patchId) return;
        const patch = patches.find(p => p.id === patchId);
        if (patch) {
          patchedRom = applyIPS(patchedRom, patch.data as Uint8Array) as Uint8Array<ArrayBuffer>;
        }
      };

      // Apply selected patches in order
      applyPatchById(battlesPatches, patchConfig.battles);
      applyPatchById(mapsPatches, patchConfig.maps);
      applyPatchById(portraitsPatches, patchConfig.portraits);

      // Apply all selected tweaks
      for (const tweakId of patchConfig.tweaks) {
        applyPatchById(tweaksPatches, tweakId);
      }

      // Download the patched ROM
      const blob = new Blob([patchedRom], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FF4 Ultima Custom.sfc';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to generate patched ROM.');
    } finally {
      setIsPatching(false);
    }
  };

  // Config management - generate config file
  const handleGenerateConfig = () => {
    const config = JSON.stringify(patchConfig, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ulti-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Config management - load config file
  const handleLoadConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as PatchConfig;
        setPatchConfig(config);
      } catch (err) {
        setError('Invalid config file format.');
      }
    };
    reader.readAsText(file);
  };

  // Render patch selector card
  const renderPatchSelector = (
    title: string,
    patches: ZipPatch[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    loading: boolean
  ) => (
    <div className="bg-indigo-600 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 capitalize">{title}</h3>
      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : (
        <select
          className="w-full p-2 border bg-indigo-700 rounded-md"
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          disabled={!romState}
        >
          <option value="">None</option>
          {patches.map((patch) => (
            <option key={patch.id} value={patch.id}>
              {patch.name}
            </option>
          ))}
        </select>
      )}
      {selectedId && patches.find(p => p.id === selectedId)?.previewImage && (
        <div className="mt-2">
          <img
            src={patches.find(p => p.id === selectedId)?.previewImage}
            alt="Preview"
            className="w-full rounded-md bg-slate-900"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
    </div>
  );

  // Render tweaks multi-select
  const renderTweaksSelector = () => (
    <div className="bg-indigo-600 p-4 rounded-lg shadow-md col-span-2 md:col-span-4">
      <h3 className="text-lg font-semibold mb-2">Game Tweaks (select multiple)</h3>
      {loadingTweaks ? (
        <p className="text-gray-300">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tweaksPatches.map((patch) => (
            <label
              key={patch.id}
              className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                patchConfig.tweaks.includes(patch.id)
                  ? 'bg-indigo-400'
                  : 'bg-indigo-700 hover:bg-indigo-500'
              } ${!romState ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={patchConfig.tweaks.includes(patch.id)}
                onChange={() => handleTweakToggle(patch.id)}
                disabled={!romState}
                className="mr-2"
              />
              <span className="text-sm">{patch.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const hasSelections = patchConfig.battles || patchConfig.maps ||
                        patchConfig.portraits || patchConfig.tweaks.length > 0;

  return (
    <div className="container mx-auto p-4 bg-indigo-800 min-h-screen">
      <BothTitles />
      <h1 className="text-3xl font-bold mb-2 text-center">The Ulti Patcher</h1>
      <p className="text-center mb-4 text-gray-300">
        Build your custom FF4 Ultima with modular patch options
      </p>

      {/* ROM Upload */}
      <div className="bg-indigo-700 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">1. Upload your ROM</h3>
        <input
          className="bg-gray-600 p-3 rounded shadow-md w-full"
          type="file"
          accept=".smc,.sfc"
          onChange={handleFileUpload}
          disabled={loadingMain || isPatching}
        />
        {loadingMain && <p className="text-gray-300 mt-2">Loading patch database...</p>}
        {romState && (
          <p className="text-green-400 mt-2">
            ROM verified - CRC32: {romState.originalCRC32}
          </p>
        )}
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>

      {/* Patch Selectors - 4 modular options */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">2. Choose your options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {renderPatchSelector('Battle Sprites', battlesPatches, patchConfig.battles,
            (id) => handleSingleSelect('battles', id), loadingBattles)}
          {renderPatchSelector('Map Sprites', mapsPatches, patchConfig.maps,
            (id) => handleSingleSelect('maps', id), loadingMaps)}
          {renderPatchSelector('Portraits', portraitsPatches, patchConfig.portraits,
            (id) => handleSingleSelect('portraits', id), loadingPortraits)}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderTweaksSelector()}
        </div>
      </div>

      {/* Config Management */}
      <div className="bg-indigo-700 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">3. Save/Load Config (optional)</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="bg-gray-600 hover:bg-gray-500 p-3 rounded shadow-md disabled:opacity-50"
            onClick={handleGenerateConfig}
            disabled={!hasSelections}
          >
            Save Config
          </button>
          <label className="bg-gray-600 hover:bg-gray-500 p-3 rounded shadow-md cursor-pointer">
            Load Config
            <input
              type="file"
              accept=".json,.txt"
              onChange={handleLoadConfig}
              className="hidden"
            />
          </label>
        </div>
        {hasSelections && (
          <div className="mt-2 text-sm text-gray-300">
            Selected: {[
              patchConfig.battles && 'Battle',
              patchConfig.maps && 'Map',
              patchConfig.portraits && 'Portrait',
              patchConfig.tweaks.length > 0 && `${patchConfig.tweaks.length} Tweak(s)`
            ].filter(Boolean).join(', ')}
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="bg-indigo-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">4. Download</h3>
        <button
          className="bg-green-600 hover:bg-green-500 p-4 rounded shadow-md text-xl font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleDownload}
          disabled={!romState || isPatching}
        >
          {isPatching ? 'Generating...' : 'Download Patched ROM'}
        </button>
      </div>

      {isPatching && <SpinnerOverlay />}
    </div>
  );
};

export default Ulti;
