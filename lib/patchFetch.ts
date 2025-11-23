// used by components/PatchSelector.tsx
export const fetchPatches = async (category: string): Promise<string[]> => {
  const patchBasePath = `/patches/${category}`;
  const patchFiles: string[] = [];

  const fetchFilesFromDir = async (dirPath: string) => {
    try {
      const response = await fetch(dirPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch directory: ${dirPath}`);
      }
      const entries = await response.json() as { path: string; type: string }[];

      for (const entry of entries) {
        if (entry.type === 'directory') {
          await fetchFilesFromDir(`${dirPath}${entry.path}/`);
        } else if (entry.path.endsWith('.ips')) {
          patchFiles.push(entry.path);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch files from directory: ${dirPath}`, err);
    }
  };

  await fetchFilesFromDir(patchBasePath);
  return patchFiles;
};