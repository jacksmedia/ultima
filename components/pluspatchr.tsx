'use client';

import React, { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButton from '@/components/DownloadRomButton';
import RomVerifier from '@/components/RomVerifier';
import CustomOptionsPanel from '@/components/CustomOptionsPanel';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import { useOptionalPatches } from '@/hooks/useOptionalPatches';

type Patch = {
  name: string;
  data: Uint8Array;
  originalName: string;
};

export default function PatchPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchedRom, setPatchedRom] = useState<Uint8Array | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crcInfo, setCrcInfo] = useState<string | null>(null);
  const [loadingPatches, setLoadingPatches] = useState(true);
  const [selectedOptionalPatches, setSelectedOptionalPatches] = useState<string[]>([]);

  // Configure optional patches (memoized to prevent re-renders)
  const optionalPatchesConfig = useMemo(() => ({
    categories: [
      {
        id: 'fonts',
        title: 'Font Options',
        description: 'Custom font modifications',
        allowMultiple: true,
        zipFile: 'Fonts.zip'
        // No filePattern - accepts all .ips files
      },
      {
        id: 'styles',
        title: 'Style Options',
        description: 'Visual style modifications',
        allowMultiple: true,
        zipFile: 'Styles.zip'
      }
    ]
  }), []);

  const { 
    categories: optionalCategories, 
    loading: loadingOptional, 
    error: optionalError,
    getSelectedPatches 
  } = useOptionalPatches(optionalPatchesConfig);

  // Load main patches
  useEffect(() => {
    const loadPatches = async () => {
      try {
        setLoadingPatches(true);
        const response = await fetch('/FF4UP.zip');
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        const patchEntries: Patch[] = [];

        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
              return;
            }
            
            try {
              const originalName = file.name.split('/').pop() || file.name;
              const data = new Uint8Array(await file.async('arraybuffer'));
              
              const header = new TextDecoder().decode(data.slice(0, 5));
              if (header !== 'PATCH') {
                console.warn(`Skipping invalid IPS file: ${file.name} (invalid header: ${header})`);
                return;
              }
              
              const nameWithoutExtension = originalName.replace(/\.ips$/i, '').toUpperCase();
              
              patchEntries.push({ 
                name: nameWithoutExtension, 
                data,
                originalName
              });
              
              console.log(`Loaded patch: ${nameWithoutExtension} from ${originalName}`);
            } catch (err) {
              console.error(`Error processing patch file ${file.name}:`, err);
            }
          })
        );

        console.log(`Successfully loaded ${patchEntries.length} main patches`);
        setPatches(patchEntries);
      } catch (err) {
        console.error('Failed to load patches:', err);
        setError('Failed to load main patch files.');
      } finally {
        setLoadingPatches(false);
      }
    };

    loadPatches();
  }, []);
  
  const EXPECTED_CRC32 = '97C92761';
  
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) {
      console.log('ROM header detected, removing 512 bytes');
      return romData.slice(512);
    }
    return romData;
  };

  const handleMatch = async (romFile: File) => {
    setIsPatching(true);
    setError(null);
    setPatchedRom(null);
    setCrcInfo(null);

    try {
      // Load the ROM bytes
      const romBytes = new Uint8Array(await romFile.arrayBuffer());
      const headerlessRom = removeHeaderIfPresent(romBytes);
      const romCRC32 = computeCRC32(headerlessRom);
      
      console.log(`ROM CRC32: ${romCRC32}`);
      
      // Find matching main patch
      const matchingPatch = patches.find(patch => patch.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }
      
      console.log(`Found matching main patch: ${matchingPatch.originalName}`);
      
      // Expand ROM if needed
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;
      
      // Apply main patch
      let patchedData = applyIPS(expandedRom, matchingPatch.data);
      console.log(`Applied main patch: ${matchingPatch.originalName}`);

      // Apply optional patches in order of selection
      const selectedOptionals = getSelectedPatches(selectedOptionalPatches);
      for (const optionalPatch of selectedOptionals) {
        console.log(`Applying optional patch: ${optionalPatch.name}`);
        patchedData = applyIPS(patchedData, optionalPatch.data);
      }

      // Calculate final CRC32
      const finalCRC32 = computeCRC32(patchedData);
      
      // Update info display
      const optionalInfo = selectedOptionals.length > 0 
        ? ` + ${selectedOptionals.length} optional patch${selectedOptionals.length > 1 ? 'es' : ''}` 
        : '';
      setCrcInfo(`Original: ${romCRC32}, Final: ${finalCRC32}${optionalInfo}`);
      
      console.log(`Final patched ROM CRC32: ${finalCRC32}`);
      console.log(`Applied ${selectedOptionals.length} optional patches`);
      
      // Note: With optional patches, the final CRC32 may not match the expected base patch CRC32
      if (selectedOptionals.length === 0 && finalCRC32 !== EXPECTED_CRC32) {
        console.warn(`Base patch CRC32 mismatch: expected ${EXPECTED_CRC32}, got ${finalCRC32}`);
      }

      setPatchedRom(patchedData);
    } catch (err: any) {
      console.error('Error during patching:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  const isReady = !loadingPatches && patches.length > 0;
  const hasOptionalPatches = optionalCategories.length > 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-3xl font-bold">FF4 Ultima Patcher</h1>
      
      <p className="text-gray-300 max-w-md text-center mb-4">
        Upload your FF4 ROM file to patch it to the Ultima Plus version with optional customizations.
      </p>

      {/* Main ROM Upload */}
      {loadingPatches ? (
        <p>Loading main patches...</p>
      ) : isReady ? (
        <RomVerifier onMatch={handleMatch} />
      ) : (
        <p className="text-red-500">No main patches could be loaded. Please refresh the page.</p>
      )}

      {/* Optional Patches Panel */}
      {isReady && hasOptionalPatches && (
        <CustomOptionsPanel
          categories={optionalCategories}
          selectedPatches={selectedOptionalPatches}
          onSelectionChange={setSelectedOptionalPatches}
          isDisabled={isPatching}
        />
      )}

      {/* Loading state for optional patches */}
      {loadingOptional && (
        <p className="text-gray-400 text-sm">Loading optional patches...</p>
      )}

      {/* Errors */}
      {error && <p className="text-red-500 font-medium">{error}</p>}
      {optionalError && <p className="text-yellow-500 font-medium">Optional patches: {optionalError}</p>}
      
      {/* CRC32 Information */}
      {crcInfo && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl mb-2">Patch Information:</h2>
          <p className="font-mono text-sm">{crcInfo}</p>
          {selectedOptionalPatches.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-300">Selected options:</p>
              <ul className="text-xs text-gray-400 mt-1">
                {getSelectedPatches(selectedOptionalPatches).map(patch => (
                  <li key={patch.id}>• {patch.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Download Button */}
      <DownloadRomButton
        romData={patchedRom}
        filename={`FF4 Ultima Plus${selectedOptionalPatches.length > 0 ? ' Custom' : ''}.sfc`}
        disabled={!patchedRom || isPatching}
      />

      {isPatching && <SpinnerOverlay />}
    </div>
  );
}