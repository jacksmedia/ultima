// Ulti Patcher - modular patch config builder with multi-select options
import React, { useMemo, useState } from 'react';
import { useZipPatches, ZipPatch } from '@/hooks/useZipPatches';
import { applyIPS } from '@/lib/patcher';
import Layout from '@/layout';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import BothTitles from '@/components/BothTitles';

type RomFile = {
  file: File;
  data: Uint8Array;
};

// All categories now support multiple selections
type PatchConfig = {
  battles: string[];
  maps: string[];
  portraits: string[];
  tweaks: string[];
};

const Ulti: React.FC = () => {
  // ROM state - simplified, no CRC matching
  const [romFile, setRomFile] = useState<RomFile | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patch selections (4 modular categories - all multi-select)
  const [patchConfig, setPatchConfig] = useState<PatchConfig>({
    battles: [],
    maps: [],
    portraits: [],
    tweaks: []
  });

  // Load patches from ZIP files using unified hook
  const battlesConfig = useMemo(() => ({
    categories: [{
      id: 'battles',
      title: 'Battle Sprites',
      description: 'Changes hero graphics in battle',
      allowMultiple: true,
      zipFile: 'Battles.zip'
    }]
  }), []);

  const mapsConfig = useMemo(() => ({
    categories: [{
      id: 'maps',
      title: 'Map Sprites',
      description: 'Changes the heroes\' map avatars',
      allowMultiple: true,
      zipFile: 'Maps.zip'
    }]
  }), []);

  const portraitsConfig = useMemo(() => ({
    categories: [{
      id: 'portraits',
      title: 'Portraits',
      description: 'Changes the hero faces in the menu',
      allowMultiple: true,
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

  // Remove ROM copier header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) {
      return romData.slice(512);
    }
    return romData;
  };

  // Handle ROM upload - simplified, just accept file and enable options
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer);
      const headerlessRom = removeHeaderIfPresent(romBytes);

      // Expand ROM to 2MB if needed
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;

      setRomFile({
        file,
        data: expandedRom
      });
    } catch (err: any) {
      setError(err.message || 'Failed to read ROM file.');
    }
  };

  // Handle patch toggle for any category (all are multi-select now)
  const handlePatchToggle = (category: keyof PatchConfig, patchId: string) => {
    setPatchConfig(prev => ({
      ...prev,
      [category]: prev[category].includes(patchId)
        ? prev[category].filter(id => id !== patchId)
        : [...prev[category], patchId]
    }));
  };

  // Generate and download patched ROM
  const handleDownload = async () => {
    if (!romFile) return;

    setIsPatching(true);
    try {
      let patchedRom = new Uint8Array(romFile.data);

      // Helper to find and apply patches by ID
      const applyPatchesFromCategory = (patches: ZipPatch[], selectedIds: string[]) => {
        for (const patchId of selectedIds) {
          const patch = patches.find(p => p.id === patchId);
          if (patch) {
            patchedRom = applyIPS(patchedRom, patch.data as Uint8Array) as Uint8Array<ArrayBuffer>;
          }
        }
      };

      // Apply selected patches in order by category
      applyPatchesFromCategory(battlesPatches, patchConfig.battles);
      applyPatchesFromCategory(mapsPatches, patchConfig.maps);
      applyPatchesFromCategory(portraitsPatches, patchConfig.portraits);
      applyPatchesFromCategory(tweaksPatches, patchConfig.tweaks);

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

  // Config management - load config file (options remain editable after loading)
  const handleLoadConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedConfig = JSON.parse(e.target?.result as string);
        // Migrate old single-select format to multi-select arrays
        const migratedConfig: PatchConfig = {
          battles: Array.isArray(loadedConfig.battles)
            ? loadedConfig.battles
            : (loadedConfig.battles ? [loadedConfig.battles] : []),
          maps: Array.isArray(loadedConfig.maps)
            ? loadedConfig.maps
            : (loadedConfig.maps ? [loadedConfig.maps] : []),
          portraits: Array.isArray(loadedConfig.portraits)
            ? loadedConfig.portraits
            : (loadedConfig.portraits ? [loadedConfig.portraits] : []),
          tweaks: Array.isArray(loadedConfig.tweaks)
            ? loadedConfig.tweaks
            : (loadedConfig.tweaks ? [loadedConfig.tweaks] : [])
        };
        setPatchConfig(migratedConfig);
        setError(null);
      } catch (err) {
        setError('Invalid config file format.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be loaded again
    event.target.value = '';
  };

  // Render multi-select patch category
  const renderPatchCategory = (
    title: string,
    category: keyof PatchConfig,
    patches: ZipPatch[],
    loading: boolean
  ) => (
    <div className="bg-indigo-600 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-xs text-gray-300 mb-2">Select multiple options</p>
      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {patches.map((patch) => (
            <label
              key={patch.id}
              className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                patchConfig[category].includes(patch.id)
                  ? 'bg-indigo-400'
                  : 'bg-indigo-700 hover:bg-indigo-500'
              }`}
            >
              <input
                type="checkbox"
                checked={patchConfig[category].includes(patch.id)}
                onChange={() => handlePatchToggle(category, patch.id)}
                className="mr-2"
              />
              <span className="text-sm">{patch.name}</span>
            </label>
          ))}
        </div>
      )}
      {patchConfig[category].length > 0 && (
        <p className="text-xs text-green-300 mt-2">
          {patchConfig[category].length} selected
        </p>
      )}
    </div>
  );

  const totalSelections = patchConfig.battles.length + patchConfig.maps.length +
                          patchConfig.portraits.length + patchConfig.tweaks.length;
  const hasSelections = totalSelections > 0;

  return (
    <div>
      <Layout>
      <div className="container mx-auto bg-indigo-800 min-h-screen">
        <BothTitles />
        <h1 className="text-3xl font-bold mb-2 text-center">The Ulti Patcher</h1>
        <p className="text-center mb-4 text-gray-300">
          Build your custom FF4 Ultima with modular patch options
        </p>

        {/* ROM Upload - simplified */}
        <div className="bg-indigo-700 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">1. Upload your ROM file</h3>
          <p className="text-sm text-gray-300 mb-2">Upload an .sfc or .smc file to enable patch options</p>
          <input
            className="bg-gray-600 p-3 rounded shadow-md w-full"
            type="file"
            accept=".smc,.sfc"
            onChange={handleFileUpload}
            disabled={isPatching}
          />
          {romFile && (
            <p className="text-green-400 mt-2">
              ROM loaded: {romFile.file.name} ({(romFile.data.length / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>

        {/* Patch Selectors - 4 modular options, all multi-select */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">2. Choose your options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderPatchCategory('Battle Sprites', 'battles', battlesPatches, loadingBattles)}
            {renderPatchCategory('Map Sprites', 'maps', mapsPatches, loadingMaps)}
            {renderPatchCategory('Portraits', 'portraits', portraitsPatches, loadingPortraits)}
            {renderPatchCategory('Game Tweaks', 'tweaks', tweaksPatches, loadingTweaks)}
          </div>
        </div>

        {/* Config Management */}
        <div className="bg-indigo-700 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">3. Save/Load Config</h3>
          <p className="text-sm text-gray-300 mb-2">
            Save your selections as a config file, or load an existing config to modify
          </p>
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
            {hasSelections && (
              <button
                className="bg-red-600 hover:bg-red-500 p-3 rounded shadow-md"
                onClick={() => setPatchConfig({ battles: [], maps: [], portraits: [], tweaks: [] })}
              >
                Clear All
              </button>
            )}
          </div>
          {hasSelections && (
            <div className="mt-2 text-sm text-gray-300">
              Total selections: {totalSelections} patch{totalSelections !== 1 ? 'es' : ''}
              <span className="ml-2 text-xs">
                ({patchConfig.battles.length} battle, {patchConfig.maps.length} map,
                {patchConfig.portraits.length} portrait, {patchConfig.tweaks.length} tweak)
              </span>
            </div>
          )}
        </div>

        {/* Download Button */}
        <div className="bg-indigo-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">4. Download</h3>
          <button
            className="bg-green-600 hover:bg-green-500 p-4 rounded shadow-md text-xl font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownload}
            disabled={!romFile || !hasSelections || isPatching}
          >
            {isPatching ? 'Generating...' : 'Download Patched ROM'}
          </button>
          {!romFile && (
            <p className="text-yellow-400 text-sm mt-2">Upload a ROM file first</p>
          )}
          {romFile && !hasSelections && (
            <p className="text-yellow-400 text-sm mt-2">Select at least one patch option</p>
          )}
        </div>

        {isPatching && <SpinnerOverlay />}
      </div>
    </Layout>
    </div>
  );
};

export default Ulti;
