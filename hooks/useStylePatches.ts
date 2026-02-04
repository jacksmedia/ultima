// Backward-compatible wrapper around useZipPatches
// Use useZipPatches directly for new code
import { useZipPatches, ZipPatchesConfig, ZipPatch, ZipPatchCategory } from './useZipPatches';

// Re-export types for backward compatibility
export type StylePatch = ZipPatch;
export type PatchCategory = ZipPatchCategory;
export type StylePatchesConfig = ZipPatchesConfig;

export const useStylePatches = (config: StylePatchesConfig) => {
  const { categories, loading, error, getSelectedPatches } = useZipPatches(config);

  return {
    categories,
    loading,
    error,
    getSelectedStylePatches: getSelectedPatches
  };
};
