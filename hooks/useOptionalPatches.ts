// Backward-compatible wrapper around useZipPatches
// Use useZipPatches directly for new code
import { useZipPatches, ZipPatchesConfig, ZipPatch, ZipPatchCategory } from './useZipPatches';

// Re-export types for backward compatibility
export type OptionalPatch = ZipPatch;
export type PatchCategory = ZipPatchCategory;
export type OptionalPatchesConfig = ZipPatchesConfig;

export const useOptionalPatches = (config: OptionalPatchesConfig) => {
  const { categories, loading, error, getSelectedPatches } = useZipPatches(config);

  return {
    categories,
    loading,
    error,
    getSelectedOptionalPatches: getSelectedPatches
  };
};
