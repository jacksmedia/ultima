// PlusPatcher.tsx developed with Claude Sonnet 4
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
  originalName: string; // filename without path
};

// Interface for ROM state mgmt
type RomState = {
  originalFile: File;
  processedRom: Uint8Array; // headerless, expanded ROM ready for patching
  matchingPatch: Patch;
  originalCRC32: string; // previously discrete state
};

export default function PatchPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [romState, setRomState] = useState<RomState | null>(null); // Stores ROM + patch info
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPatches, setLoadingPatches] = useState(true);
  const [selectedOptionalPatches, setSelectedOptionalPatches] = useState<string[]>([]);

  // Optional patches by category
  const optionalPatchesConfig = useMemo(() => ({
    categories : [
      {
        id: 'battles',
        title: 'Battle Sprites',
        description: 'Changes hero graphics in battle',
        allowMultiple: false,
        zipFile: 'Battles.zip',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}-manifest.txt`
      },
      {
        id: 'maps',
        title: 'Map Sprites',
        description: 'Changes the heroes\' map avatars',
        allowMultiple: false,
        zipFile: 'Maps.zip',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}-manifest.txt`
      },
      {
        id: 'portraits',
        title: 'Portraits',
        description: 'Changes the hero faces in the menu',
        allowMultiple: false,
        zipFile: 'Portraits.zip',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}-manifest.txt`
      },
      // {
      //   id: 'styles',
      //   title: 'Styles',
      //   description: 'Changes all hero graphics',
      //   allowMultiple: false,
      //   zipFile: 'Styles.zip',
      //   hasManifest: true,
      //   manifestPath: (patchName: string) => `/manifests/${patchName}-manifest.txt`
      //   // filePattern: /Style/i // can be used filter a multi-catergory archive
      // },
      {
        id: 'fonts',
        title: 'Alt Fonts (+ Item Names)',
        description: 'Alternate Fonts, + Alt. Item Names with SBG',
        allowMultiple: false,
        zipFile: 'Fonts.zip',
        hasManifest: false
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
            
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
              return; // filtered for patch files only
            }
            
            try {
              const originalName = file.name.split('/').pop() || file.name; // rm path
              const data = new Uint8Array(await file.async('arraybuffer')); // convert to raw Uint8Array
              
              const header = new TextDecoder().decode(data.slice(0, 5)); // verifies ips header ("PATCH")
              if (header !== 'PATCH') {
                console.warn(`Skipping invalid IPS file: ${file.name} (invalid header: ${header})`);
                return;
              }
              
              const nameWithoutExtension = originalName.replace(/\.ips$/i, '').toUpperCase(); // case mgmt for CRC32 matching
              
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
//////////////////////////////////////
  const EXPECTED_CRC32 = '1F373E00';  // current Ultima Plus CRC32
////////////////////////////////////// obv this changes per update

  // Detects & removes SMC/SFC copier header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) { // copier header is always 512 bytes
      console.log('ROM copier header detected, removing 512 bytes');
      return romData.slice(512);
    }
    return romData;
  };

  // Validates & prepares ROM
  const handleMatch = async (romFile: File) => {
    setIsPatching(true);
    setError(null);
    setRomState(null);

    try {
      // Loads ROM bytes
      const arrayBuffer = await romFile.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer); // needed for specificity in Type
      // Checks, removes header if present
      const headerlessRom = removeHeaderIfPresent(romBytes);
      // Calculates original ROM CRC32
      const romCRC32 = computeCRC32(headerlessRom);
      console.log(`ROM CRC32: ${romCRC32}`); // debug log

      // Finds matching main patch by CRC32
      const matchingPatch = patches.find(patch => patch.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(`No matching patch found for ROM with CRC32: ${romCRC32}`);
      }
      console.log(`Found matching patch: ${matchingPatch.originalName}`);

      // Expands uploaded rom to 2MB to fit FF4 Ultima
      const expandedRom = headerlessRom.length < 2 * 1024 * 1024
        ? (() => {
            const newRom = new Uint8Array(2 * 1024 * 1024);
            newRom.set(headerlessRom);
            return newRom;
          })()
        : headerlessRom;

      // Stores ROM state; allows for optional patches to be added
      setRomState({
        originalFile: romFile,
        processedRom: expandedRom,
        matchingPatch: matchingPatch,
        originalCRC32: romCRC32
      });

      console.log('ROM validated and ready for patching');
    } catch (err: any) {
      console.error('Error during ROM validation:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  // Generates patched ROM (called by DownloadRomButton)
  const generatePatchedRom = async (): Promise<Uint8Array> => {
    if (!romState) {
      throw new Error('No ROM loaded');
    }
    console.log('Generating patched ROM...');
    // Starts with the processed ROM...
    let patchedRom = new Uint8Array(romState.processedRom.buffer.slice(0)); // snaps the Type into conformity! What madness!
    // Applies main patch
    patchedRom = applyIPS(patchedRom, romState.matchingPatch.data as Uint8Array);
    console.log(`Applied main patch: ${romState.matchingPatch.originalName}`);
    // Applies optional patches (in order of selection)
    const selectedOptionals = getSelectedPatches(selectedOptionalPatches);
    for (const optionalPatch of selectedOptionals) {
      console.log(`Applying optional patch: ${optionalPatch.name}`);
      patchedRom = applyIPS(patchedRom, optionalPatch.data);
    }
    console.log(`Final patched ROM generated with ${selectedOptionals.length} optional patches`);
    return patchedRom;
  };

  // Control checks
  const hasValidRom = romState !== null;
  const isReady = !loadingPatches && patches.length > 0;
  const hasOptionalPatches = optionalCategories.length > 0;
  
  return (
  <>
    <div className="two-column-layout">
      <div className='d-flex justify-content-center align-items-center h-100'>
        <PlusTitle />
        <p className="text-center mb-2">
          Upload your FFII or FFIV ROM file to create a copy of FF4 Ultima Plus.<br/>
          Choose alternate graphics & a different font if you wish!
        </p>
        <DownloadRomButton
          onGenerateRom={generatePatchedRom} // Now uses generator function
          filename={`FF4 Ultima Plus${selectedOptionalPatches.length > 0 ? ' Custom' : ''}.sfc`}
          disabled={!hasValidRom || isPatching}
        />
      </div>

      <div className='d-flex justify-content-center align-items-center h-100'>
        {loadingPatches ? (
          <p>Loading main patches...</p>
        ) : isReady ? (
          <RomVerifier onMatch={handleMatch} />
        ) : (
          <p className="text-danger">No patches could be loaded. Please refresh the page.</p>
        )}
      </div>
    </div>
{/* Optional Patches Panel */}
    <div className='d-flex justify-content-center align-items-center h-100'>
      {isReady && hasOptionalPatches && (
        <CustomOptionsPanel
          categories={optionalCategories}
          selectedPatches={selectedOptionalPatches}
          onSelectionChange={setSelectedOptionalPatches}
          isDisabled={isPatching || !hasValidRom}
        />
      )}
      {/* Loading state for optional patches */}
      {loadingOptional && (
        <p className="text-gray-400 text-sm">Loading optional patches...</p>
      )}
      {/* Errors */}
      {error && <p className="text-red-500 font-medium">{error}</p>}
      {optionalError && <p className="text-yellow-500 font-medium">Optional patches: {optionalError}</p>}
      
      {/* ROM Information */}
      {hasValidRom && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl mb-2">ROM Ready:</h2>
          <p className="font-mono text-sm">
            Uploaded CRC32: {romState!.originalCRC32}
          </p>
          {/* <p className="text-sm text-gray-300">
            Matching patch: {romState!.matchingPatch.originalName}
          </p> */}
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