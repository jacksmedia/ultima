// Unified hook for loading patches from ZIP files
// Replaces useOptionalPatches.ts and useStylePatches.ts
import { useState, useEffect } from 'react';
import JSZip from 'jszip';

// Shared patch interface used by both StylesPanel and CustomOptionsPanel
export interface ZipPatch {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: Uint8Array;
  category?: string;
  previewImage?: string;
}

export interface ZipPatchCategory {
  id: string;
  title: string;
  description?: string;
  patches: ZipPatch[];
  allowMultiple?: boolean;
}

export interface ZipPatchesConfig {
  zipFiles?: string[];
  categories?: {
    id: string;
    title: string;
    description?: string;
    allowMultiple?: boolean;
    zipFile?: string;
    filePattern?: RegExp;
  }[];
}

export const useZipPatches = (config: ZipPatchesConfig) => {
  const [categories, setCategories] = useState<ZipPatchCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedCategories: ZipPatchCategory[] = [];

        if (config.categories) {
          for (const categoryConfig of config.categories) {
            const patches: ZipPatch[] = [];

            if (categoryConfig.zipFile) {
              try {
                const response = await fetch(`/${categoryConfig.zipFile}`);
                const zipData = await response.arrayBuffer();
                if (zipData.byteLength === 0) {
                  console.warn(`Empty ZIP file: ${categoryConfig.zipFile}`);
                  continue;
                }
                console.log(`Loading ${categoryConfig.zipFile} (${zipData.byteLength} bytes)`);
                const zip = await JSZip.loadAsync(zipData);

                await Promise.all(
                  Object.keys(zip.files).map(async (filename) => {
                    const file = zip.files[filename];
                    if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
                      return;
                    }
                    if (categoryConfig.filePattern && !categoryConfig.filePattern.test(file.name)) {
                      return;
                    }

                    try {
                      const originalName = file.name.split('/').pop() || file.name;
                      const data = new Uint8Array(await file.async('arraybuffer'));

                      const header = new TextDecoder().decode(data.slice(0, 5));
                      if (header !== 'PATCH') {
                        console.warn(`Skipping invalid IPS file: ${file.name}`);
                        return;
                      }

                      const displayName = originalName
                        .replace(/\.ips$/i, '')
                        .replace(/[-_]/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                      const previewImagePath = `/previews/${originalName.replace(/\.ips$/i, '')}.png`;

                      patches.push({
                        id: `${categoryConfig.id}-${originalName}`,
                        name: displayName,
                        description: `Apply ${displayName} modifications`,
                        filename: originalName,
                        data,
                        category: categoryConfig.id,
                        previewImage: previewImagePath
                      });

                      console.log(`Loaded patch: ${displayName} from ${originalName}`);
                    } catch (err) {
                      console.error(`Error processing patch file ${file.name}:`, err);
                    }
                  })
                );
              } catch (err) {
                console.error(`Failed to load patches from ${categoryConfig.zipFile}:`, err);
              }
            }

            loadedCategories.push({
              id: categoryConfig.id,
              title: categoryConfig.title,
              description: categoryConfig.description,
              patches: patches.sort((a, b) => a.name.localeCompare(b.name)),
              allowMultiple: categoryConfig.allowMultiple ?? true
            });
          }
        } else if (config.zipFiles) {
          for (const zipFile of config.zipFiles) {
            try {
              const response = await fetch(`/${zipFile}`);
              const zipData = await response.arrayBuffer();
              const zip = await JSZip.loadAsync(zipData);
              const patches: ZipPatch[] = [];

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
                      console.warn(`Skipping invalid IPS file: ${file.name}`);
                      return;
                    }

                    const displayName = originalName
                      .replace(/\.ips$/i, '')
                      .replace(/[-_]/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());

                    patches.push({
                      id: originalName,
                      name: displayName,
                      description: `Apply ${displayName} modifications`,
                      filename: originalName,
                      data
                    });
                  } catch (err) {
                    console.error(`Error processing patch file ${file.name}:`, err);
                  }
                })
              );

              if (patches.length > 0) {
                loadedCategories.push({
                  id: `patches-${zipFile}`,
                  title: `Patches from ${zipFile}`,
                  patches: patches.sort((a, b) => a.name.localeCompare(b.name)),
                  allowMultiple: true
                });
              }
            } catch (err) {
              console.error(`Failed to load patches from ${zipFile}:`, err);
            }
          }
        }

        console.log(`Successfully loaded ${loadedCategories.length} patch categories`);
        setCategories(loadedCategories);
      } catch (err) {
        console.error('Failed to load patches:', err);
        setError('Failed to load patch files.');
      } finally {
        setLoading(false);
      }
    };

    loadPatches();
  }, [config]);

  const getSelectedPatches = (selectedIds: string[]): ZipPatch[] => {
    const allPatches = categories.flatMap(cat => cat.patches);
    return selectedIds
      .map(id => allPatches.find(patch => patch.id === id))
      .filter((patch): patch is ZipPatch => patch !== undefined);
  };

  return {
    categories,
    loading,
    error,
    getSelectedPatches
  };
};
