// Ulti Patcher - modular patch config builder with dropdown multi-select
import React, { useEffect, useState } from 'react';
import { applyIPS } from '@/lib/patcher';
import Layout from '@/layout';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import BothTitles from '@/components/BothTitles';

type RomFile = {
  file: File;
  data: Uint8Array;
};

type PatchOption = {
  path: string;      // Full path like "Kain\\Kain (Classic DS, by xJ4cks).ips"
  name: string;      // Display name extracted from filename
  previewPath: string; // Path to preview image
};

type CategoryData = {
  id: string;
  title: string;
  patches: PatchOption[];
  loading: boolean;
};

// All categories support multiple selections
type PatchConfig = {
  battle: string[];
  map: string[];
  portraits: string[];
  fonts: string[];
  game: string[];
};

const CATEGORIES = [
  { id: 'battle', title: 'Battle Sprites', jsonFile: 'battle.json', baseDir: 'battle' },
  { id: 'map', title: 'Map Sprites', jsonFile: 'map.json', baseDir: 'map' },
  { id: 'portraits', title: 'Portraits', jsonFile: 'portraits.json', baseDir: 'portraits' },
  { id: 'fonts', title: 'Fonts', jsonFile: null, baseDir: 'fonts' }, // Direct directory listing
  { id: 'game', title: 'Game Tweaks', jsonFile: 'game.json', baseDir: 'game' },
] as const;

const Ulti: React.FC = () => {
  // ROM state
  const [romFile, setRomFile] = useState<RomFile | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category data loaded from JSON files
  const [categories, setCategories] = useState<Record<string, CategoryData>>({
    battle: { id: 'battle', title: 'Battle Sprites', patches: [], loading: true },
    map: { id: 'map', title: 'Map Sprites', patches: [], loading: true },
    portraits: { id: 'portraits', title: 'Portraits', patches: [], loading: true },
    fonts: { id: 'fonts', title: 'Fonts', patches: [], loading: true },
    game: { id: 'game', title: 'Game Tweaks', patches: [], loading: true },
  });

  // Patch selections
  const [patchConfig, setPatchConfig] = useState<PatchConfig>({
    battle: [],
    map: [],
    portraits: [],
    fonts: [],
    game: []
  });

  // Load patches from JSON files on mount
  useEffect(() => {
    const loadCategory = async (category: typeof CATEGORIES[number]) => {
      try {
        let patchPaths: string[] = [];

        if (category.jsonFile) {
          // Load from JSON file
          const response = await fetch(`/patches/${category.jsonFile}`);
          if (response.ok) {
            patchPaths = await response.json();
          }
        } else if (category.id === 'fonts') {
          // For fonts, load from manifest.json (direct array format)
          const response = await fetch('/patches/fonts/manifest.json');
          if (response.ok) {
            patchPaths = await response.json();
          }
        }

        // Convert paths to PatchOption objects
        const patches: PatchOption[] = patchPaths
          .filter((p: string) => p.toLowerCase().endsWith('.ips'))
          .map((path: string) => {
            // Extract filename from path (handle both \ and /)
            const filename = path.split(/[\\\/]/).pop() || path;
            const name = filename.replace(/\.ips$/i, '');

            // Build preview path - replace .ips with .png
            const previewPath = `/patches/${category.baseDir}/${path.replace(/\.ips$/i, '.png')}`;

            return { path, name, previewPath };
          })
          .sort((a: PatchOption, b: PatchOption) => a.name.localeCompare(b.name));

        setCategories(prev => ({
          ...prev,
          [category.id]: {
            ...prev[category.id],
            patches,
            loading: false
          }
        }));
      } catch (err) {
        console.error(`Failed to load ${category.id} patches:`, err);
        setCategories(prev => ({
          ...prev,
          [category.id]: { ...prev[category.id], loading: false }
        }));
      }
    };

    // Load all categories
    CATEGORIES.forEach(loadCategory);
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

  // Handle multi-select change
  const handleSelectChange = (categoryId: keyof PatchConfig, event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setPatchConfig(prev => ({
      ...prev,
      [categoryId]: selectedOptions
    }));
  };

  // Fetch and apply a patch file
  const fetchAndApplyPatch = async (
    patchedRom: Uint8Array,
    categoryBaseDir: string,
    patchPath: string
  ): Promise<Uint8Array> => {
    const url = `/patches/${categoryBaseDir}/${patchPath}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch patch: ${patchPath}`);
    }
    const patchData = new Uint8Array(await response.arrayBuffer());
    return applyIPS(patchedRom, patchData) as Uint8Array<ArrayBuffer>;
  };

  // Generate and download patched ROM
  const handleDownload = async () => {
    if (!romFile) return;

    setIsPatching(true);
    setError(null);

    try {
      let patchedRom = new Uint8Array(romFile.data);

      // Apply patches from each category in order
      for (const category of CATEGORIES) {
        const selectedPatches = patchConfig[category.id as keyof PatchConfig];
        for (const patchPath of selectedPatches) {
          patchedRom = await fetchAndApplyPatch(patchedRom, category.baseDir, patchPath) as Uint8Array<ArrayBuffer>;
        }
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
        const loadedConfig = JSON.parse(e.target?.result as string);
        // Ensure all arrays exist
        const migratedConfig: PatchConfig = {
          battle: Array.isArray(loadedConfig.battle) ? loadedConfig.battle : [],
          map: Array.isArray(loadedConfig.map) ? loadedConfig.map : [],
          portraits: Array.isArray(loadedConfig.portraits) ? loadedConfig.portraits : [],
          fonts: Array.isArray(loadedConfig.fonts) ? loadedConfig.fonts : [],
          game: Array.isArray(loadedConfig.game) ? loadedConfig.game : []
        };
        setPatchConfig(migratedConfig);
        setError(null);
      } catch (err) {
        setError('Invalid config file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Get preview images for selected patches in a category
  const getSelectedPreviews = (categoryId: keyof PatchConfig): string[] => {
    const category = categories[categoryId];
    const selected = patchConfig[categoryId];
    return selected
      .map(path => category.patches.find(p => p.path === path)?.previewPath)
      .filter((p): p is string => !!p);
  };

  // Render a category with dropdown and preview
  const renderCategory = (categoryId: keyof PatchConfig) => {
    const category = categories[categoryId];
    const selectedPreviews = getSelectedPreviews(categoryId);
    const selectedCount = patchConfig[categoryId].length;

    return (
      <div key={categoryId} className="bg-indigo-600 p-4 rounded-lg shadow-md mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left side - Dropdown */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
            <p className="text-xs text-gray-300 mb-2">
              Hold Ctrl/Cmd to select multiple options
            </p>
            {category.loading ? (
              <p className="text-gray-300">Loading...</p>
            ) : (
              <select
                multiple
                size={6}
                className="w-full p-2 bg-indigo-700 border border-indigo-500 rounded-md text-white"
                value={patchConfig[categoryId]}
                onChange={(e) => handleSelectChange(categoryId, e)}
              >
                {category.patches.map((patch) => (
                  <option key={patch.path} value={patch.path} className="p-1">
                    {patch.name}
                  </option>
                ))}
              </select>
            )}
            {selectedCount > 0 && (
              <p className="text-xs text-green-300 mt-2">
                {selectedCount} selected
              </p>
            )}
          </div>

          {/* Right side - Preview images */}
          <div className="md:w-48 flex flex-col items-end justify-start">
            {selectedPreviews.length > 0 ? (
              <div className="space-y-2">
                {selectedPreviews.slice(0, 3).map((previewPath, idx) => (
                  <img
                    key={idx}
                    src={previewPath}
                    alt="Preview"
                    className="w-32 h-auto rounded border border-indigo-400"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ))}
                {selectedPreviews.length > 3 && (
                  <p className="text-xs text-gray-300">+{selectedPreviews.length - 3} more</p>
                )}
              </div>
            ) : (
              <div className="w-32 h-24 bg-indigo-800 rounded border border-indigo-500 flex items-center justify-center">
                <span className="text-xs text-gray-400">No preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalSelections = Object.values(patchConfig).reduce((sum, arr) => sum + arr.length, 0);
  const hasSelections = totalSelections > 0;
  const isLoading = Object.values(categories).some(c => c.loading);

  // Get all selected patches with their category info for the persistent preview panel
  const getAllSelectedPatches = () => {
    const allSelected: { categoryId: string; categoryTitle: string; patch: PatchOption }[] = [];

    for (const category of CATEGORIES) {
      const categoryData = categories[category.id];
      const selected = patchConfig[category.id as keyof PatchConfig];

      for (const patchPath of selected) {
        const patch = categoryData.patches.find(p => p.path === patchPath);
        if (patch) {
          allSelected.push({
            categoryId: category.id,
            categoryTitle: category.title,
            patch
          });
        }
      }
    }

    return allSelected;
  };

  const allSelectedPatches = getAllSelectedPatches();

  return (
    <div>
      <Layout>
        <div className="container mx-auto bg-indigo-800 min-h-screen">
          <BothTitles />
          <h1 className="text-3xl font-bold mb-2 text-center">The Ulti Patcher</h1>
          <p className="text-center mb-4 text-gray-300">
            Build your custom FF4 Ultima with modular patch options
          </p>

          {/* ROM Upload */}
          <div className="bg-indigo-700 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">1. Upload your ROM file</h3>
            <p className="text-sm text-gray-300 mb-2">Upload an .sfc or .smc file to enable patching</p>
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

          {/* Patch Selectors - 5 categories with dropdowns */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">2. Choose your options</h3>
            {isLoading ? (
              <p className="text-gray-300">Loading patch options...</p>
            ) : (
              <>
                {renderCategory('battle')}
                {renderCategory('map')}
                {renderCategory('portraits')}
                {renderCategory('fonts')}
                {renderCategory('game')}
              </>
            )}
          </div>

          {/* Persistent Selection Preview Panel */}
          {hasSelections && (
            <div className="bg-indigo-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Your Selections ({totalSelections} patch{totalSelections !== 1 ? 'es' : ''})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {allSelectedPatches.map(({ categoryId, categoryTitle, patch }, idx) => (
                  <div
                    key={`${categoryId}-${patch.path}-${idx}`}
                    className="bg-indigo-800 rounded-lg p-2 flex flex-col items-center"
                  >
                    <img
                      src={patch.previewPath}
                      alt={patch.name}
                      className="w-24 h-auto rounded border border-indigo-400 mb-1"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.className = 'w-24 h-16 bg-indigo-900 rounded border border-indigo-500 mb-1 flex items-center justify-center';
                        e.currentTarget.alt = 'No preview';
                      }}
                    />
                    <span className="text-xs text-center text-white truncate w-full" title={patch.name}>
                      {patch.name.length > 20 ? patch.name.slice(0, 18) + '...' : patch.name}
                    </span>
                    <span className="text-xs text-indigo-300">{categoryTitle}</span>
                    <button
                      className="mt-1 text-xs text-red-400 hover:text-red-300"
                      onClick={() => {
                        setPatchConfig(prev => ({
                          ...prev,
                          [categoryId]: prev[categoryId as keyof PatchConfig].filter(p => p !== patch.path)
                        }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  onClick={() => setPatchConfig({ battle: [], map: [], portraits: [], fonts: [], game: [] })}
                >
                  Clear All
                </button>
              )}
            </div>
            {hasSelections && (
              <div className="mt-2 text-sm text-gray-300">
                Total: {totalSelections} patch{totalSelections !== 1 ? 'es' : ''} selected
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
