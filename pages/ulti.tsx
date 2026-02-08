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

  // Page loading state
  const [pageReady, setPageReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);

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

  // Load patches from JSON files on mount (with retry logic)
  useEffect(() => {
    let isMounted = true;

    const loadCategory = async (category: typeof CATEGORIES[number], retries = 3): Promise<boolean> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          let patchPaths: string[] = [];

          if (category.jsonFile) {
            const response = await fetch(`/patches/${category.jsonFile}`);
            if (response.ok) {
              patchPaths = await response.json();
            } else if (attempt < retries - 1) {
              await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
              continue;
            }
          } else if (category.id === 'fonts') {
            const response = await fetch('/patches/fonts/manifest.json');
            if (response.ok) {
              patchPaths = await response.json();
            } else if (attempt < retries - 1) {
              await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
              continue;
            }
          }

          // Convert paths to PatchOption objects
          const patches: PatchOption[] = patchPaths
            .filter((p: string) => p.toLowerCase().endsWith('.ips'))
            .map((path: string) => {
              const filename = path.split(/[\\\/]/).pop() || path;
              const name = filename.replace(/\.ips$/i, '');
              const previewPath = `/patches/${category.baseDir}/${path.replace(/\.ips$/i, '.png')}`;
              return { path, name, previewPath };
            })
            .sort((a: PatchOption, b: PatchOption) => a.name.localeCompare(b.name));

          if (isMounted) {
            setCategories(prev => ({
              ...prev,
              [category.id]: { ...prev[category.id], patches, loading: false }
            }));
          }
          return patches.length > 0;
        } catch (err) {
          console.error(`Attempt ${attempt + 1} failed for ${category.id}:`, err);
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }

      // All retries failed
      if (isMounted) {
        setCategories(prev => ({
          ...prev,
          [category.id]: { ...prev[category.id], loading: false }
        }));
      }
      return false;
    };

    const loadAllCategories = async () => {
      setLoadError(false);
      const results = await Promise.all(CATEGORIES.map(cat => loadCategory(cat)));
      const successCount = results.filter(Boolean).length;

      if (isMounted) {
        if (successCount >= 3) {
          // At least 3 categories loaded successfully
          setPageReady(true);
        } else {
          setLoadError(true);
        }
      }
    };

    loadAllCategories();

    return () => { isMounted = false; };
  }, [loadAttempt]);

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

  // Toggle a patch selection on/off
  // Fonts category is exclusive (single-select), others allow multiple
  const togglePatch = (categoryId: keyof PatchConfig, patchPath: string) => {
    setPatchConfig(prev => {
      const current = prev[categoryId];
      const isSelected = current.includes(patchPath);

      // Fonts: exclusive selection (radio behavior)
      if (categoryId === 'fonts') {
        return {
          ...prev,
          [categoryId]: isSelected ? [] : [patchPath]
        };
      }

      // Other categories: multi-select (toggle behavior)
      return {
        ...prev,
        [categoryId]: isSelected
          ? current.filter(p => p !== patchPath)
          : [...current, patchPath]
      };
    });
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

  // Render a category with clickable toggle cards
  const renderCategory = (categoryId: keyof PatchConfig) => {
    const category = categories[categoryId];
    const selectedPaths = patchConfig[categoryId];
    const selectedCount = selectedPaths.length;

    return (
      <div key={categoryId} className="bg-indigo-600 p-4 rounded-lg shadow-md gap-y-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{category.title}</h3>
          {selectedCount > 0 && (
            <span className="text-sm text-green-300 bg-green-900/50 px-2 py-1 rounded">
              {selectedCount} selected
            </span>
          )}
        </div>
        <p className="text-xs text-gray-300 mb-3">
          {categoryId === 'fonts' ? 'Choose one font' : 'Click to select/deselect patches'}
        </p>
        {category.loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
            {category.patches.map((patch) => {
              const isSelected = selectedPaths.includes(patch.path);
              return (
                <button
                  key={patch.path}
                  onClick={() => togglePatch(categoryId, patch.path)}
                  className={`
                    p-2 rounded-lg text-left text-sm transition-all duration-150
                    ${isSelected
                      ? 'bg-green-600 hover:bg-green-500 ring-2 ring-green-400 shadow-xl'
                      : 'bg-indigo-700 hover:bg-indigo-600 border border-indigo-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <img src={patch.previewPath}
                    className={`text-lg ${isSelected ? 'text-white' : 'text-gray-400'}`}
                    />
                    <h4>
                      <span className={`text-lg ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {isSelected ? '✓ ' : '○ '}
                      </span>
                      <span className="truncate" title={patch.name}>
                        {patch.name.length > 45 ? patch.name.slice(0, 43) + '...' : patch.name}
                      </span>
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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

  // Loading screen with spinning animation
  if (!pageReady) {
    return (
      <div>
        <Layout>
          <div className="container mx-auto bg-indigo-900 min-h-screen flex flex-col items-center justify-center">
            <BothTitles />
            <div className="text-center p-8">
              {/* Spinning ring animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-green-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>

              <h1 className="text-2xl font-bold mb-2">Building Ulti Patcher</h1>
              <p className="text-gray-300 mb-4">Loading patch options...</p>

              {loadError && (
                <div className="mt-4">
                  <p className="text-yellow-400 mb-3">Some data failed to load.</p>
                  <button
                    onClick={() => {
                      setCategories({
                        battle: { id: 'battle', title: 'Battle Sprites', patches: [], loading: true },
                        map: { id: 'map', title: 'Map Sprites', patches: [], loading: true },
                        portraits: { id: 'portraits', title: 'Portraits', patches: [], loading: true },
                        fonts: { id: 'fonts', title: 'Fonts', patches: [], loading: true },
                        game: { id: 'game', title: 'Game Tweaks', patches: [], loading: true },
                      });
                      setLoadAttempt(prev => prev + 1);
                    }}
                    className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Retry Loading
                  </button>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div>
      <Layout>
        <div className="container mx-auto bg-indigo-900 min-h-screen">
          <BothTitles />
          <h1 className="text-3xl font-bold mb-2 text-center">The Ulti Patcher</h1>
          <p className="text-center mb-4 text-gray-300">
            Build your custom FF4 Ultima with modular patch options
          </p>

          {/* ROM Upload */}
          <div className="bg-indigo-700 p-4 rounded-lg gap-y-2">
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
            <div className="bg-indigo-700 p-4 rounded-lg">
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
                      className="w-24 h-auto rounded border border-indigo-600 mb-1"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.className = 'w-24 h-16 bg-indigo-900 rounded border border-indigo-600 mb-1 flex items-center justify-center';
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
          <div className="bg-indigo-700 p-4 rounded-lg gap-y-4">
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
              <label className="bg-gray-600 hover:bg-gray-500 label-styling rounded shadow-md cursor-pointer">
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
