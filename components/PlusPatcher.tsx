// developed with Claude Sonnet 4
import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButton from '@/components/DownloadRomButton';
import RomVerifier from '@/components/RomVerifier';
import CustomOptionsPanel from '@/components/CustomOptionsPanel';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import { useOptionalPatches } from '@/hooks/useOptionalPatches';
import PlusTitle from "@/components/PlusTitle";


type Patch = {
  name: string;
  data: Uint8Array;
  originalName: string; // Store the original filename without path
};

export default function PatchPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchedRom, setPatchedRom] = useState<Uint8Array | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crcInfo, setCrcInfo] = useState<string | null>(null);
  const [loadingPatches, setLoadingPatches] = useState(true);
  const [selectedOptionalPatches, setSelectedOptionalPatches] = useState<string[]>([]);

  // Optional patches by category
  const optionalPatchesConfig = useMemo(() => ({
    categories : [
      {
        id: 'styles',
        title: 'Hero Styles',
        description: 'Changes battle & map sprites, and portraits',
        allowMultiple: false,
        zipFile: 'Styles.zip',
        // filePattern: /Style/i // commented out bc not working as desired to filter and can be omitted
        // the images can added in one one big zip and filtered by filePattern, tho!
      },
      {
        id: 'fonts',
        title: 'Alt Fonts (+ Item Names)',
        description: 'Alternate Fonts, + Alt. Item Names with SBG',
        allowMultiple: false,
        zipFile: 'Fonts.zip',
        // filePattern: /i
      }
    ]
  }), []);

  const {
    categories: optionalCategories,
    loading: loadingOptional,
    error: optionalError,
    getSelectedPatches
  } = useOptionalPatches(optionalPatchesConfig);

  // Loads main Ultima patches
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
            
            // Skip directories and non-IPS files
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
              return;
            }
            
            try {
              // Get just the filename without any path
              const originalName = file.name.split('/').pop() || file.name;
              
              // Get IPS patch data as Uint8Array
              const data = new Uint8Array(await file.async('arraybuffer'));
              
              // Verify it's a valid IPS file (should start with "PATCH")
              const header = new TextDecoder().decode(data.slice(0, 5));
              if (header !== 'PATCH') {
                console.warn(`Skipping invalid IPS file: ${file.name} (invalid header: ${header})`);
                return;
              }
              
              // Store the patch name as the filename without extension (for CRC32 matching)
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

        console.log(`Successfully loaded ${patchEntries.length} main project patches`);
        setPatches(patchEntries);
      } catch (err) {
        console.error('Failed to load main patches:', err);
        setError('Failed to load main patch files.');
      } finally {
        setLoadingPatches(false);
      }
    };

    loadPatches();
  }, []);

  // current Ultima CRC32
  const EXPECTED_CRC32 = '1F373E00';

  // Helper to detect and remove SMC/SFC copier header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    // Check if ROM has the 512-byte copier header ( % only looks at the remainder after division)
    if (romData.length % 1024 === 512) {
      console.log('ROM copier header detected, removing 512 bytes');
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

      // Check and remove header if present
      const headerlessRom = removeHeaderIfPresent(romBytes);

      // Calculate original ROM CRC32
      const romCRC32 = computeCRC32(headerlessRom);

      // Debug log
      console.log(`ROM CRC32: ${romCRC32}`);

      // Find matching main patch by CRC32
      const matchingPatch = patches.find(patch => patch.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }
      console.log(`Found matching patch: ${matchingPatch.originalName}`);

      // Expand to 2MB if needed
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;

      // Apply main patch
      let patchedRom = applyIPS(expandedRom, matchingPatch.data);
      console.log(`Applied main patch: ${matchingPatch.originalName}`);

      // Calculate patched ROM CRC32
      const patchedCRC32 = computeCRC32(patchedRom);

      // Apply optional patches in order of selection
      const selectedOptionals = getSelectedPatches(selectedOptionalPatches);
      for (const optionalPatch of selectedOptionals) {
        console.log(`Applying optional patch: ${optionalPatch.name}`);
        patchedRom = applyIPS(patchedRom, optionalPatch.data);
      }

      // Re-calculate patched ROM CRC32
      const finalCRC32 = computeCRC32(patchedRom);

      // Update info display
      const optionalInfo = selectedOptionals.length > 0 
        ? ` + ${selectedOptionals.length} optional patch${selectedOptionals.length > 1 ? 'es' : ''}` 
        : '';
      setCrcInfo(`Original: ${romCRC32}, Final: ${finalCRC32}${optionalInfo}`);
      
      console.log(`Final patched ROM CRC32: ${finalCRC32}`);
      console.log(`Applied ${selectedOptionals.length} optional patches`);

      // With any optional patches, the final CRC32 will not match the expected base patch CRC32
      if (selectedOptionals.length === 0 && finalCRC32 !== EXPECTED_CRC32) {
        console.warn(`Base patch CRC32 mismatch: expected ${EXPECTED_CRC32}, got ${finalCRC32}`);
      }

      setPatchedRom(patchedRom);
    } catch (err: any) {
      console.error('Error during patching:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  const isReady = !loadingPatches && patches.length > 0; // handling for optional patches
  const hasOptionalPatches = optionalCategories.length > 0; // ditto

  return (
    <>
    <div className="two-column-layout">
    {/* 2 column layout on tablet and larger */}
      <div className='d-flex justify-content-center align-items-center h-100'>
        <PlusTitle />
        <p className="text-center mb-2">
          Upload your FFII or FFIV ROM file to create a copy of FF4 Ultima Plus.<br/>
          Choose alternate fonts and graphics if you wish!
        </p>
        <DownloadRomButton
          romData={patchedRom}
          filename={`FF4 Ultima Plus${selectedOptionalPatches.length > 0 ? ' Custom' : ''}.sfc`}
          disabled={!patchedRom || isPatching}
        />
      </div>

      <div className='d-flex justify-content-center align-items-center h-100'
      style={{backgroundColor: 'rgba(255,0,0,0.5)'}}>
        {loadingPatches ? (
          <p>Loading main patches...</p>
        ) : isReady ? (
          <RomVerifier onMatch={handleMatch} />
        ) : (
          <p className="text-danger">No patches could be loaded. Please refresh the page.</p>
        )}
      </div>
    </div>

    {/* custom options with previews */}
    <div className='d-flex justify-content-center align-items-center h-100'>
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
                  <li key={patch.id}>{patch.name}</li>
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