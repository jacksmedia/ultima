import React, { useState, useEffect } from 'react';
// import { fetchPatches } from '../lib/patchFetch';

interface Patch {
  id: string;
  name: string;
  previewUrl: string;
}

interface PatchSelectorProps {
  category: string;
  onPatchSelect: (patch: Patch) => void;
}

const PatchSelector: React.FC<PatchSelectorProps> = ({ category, onPatchSelect }) => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPatches = async () => {
      setLoading(true);
      try {
        // const patchFiles = await fetchPatches(category);
        const response = await fetch(`/patches/${category}`);
        const { patchFiles } = await response.json();
        const patches = patchFiles.map((patchFile) => ({
          id: patchFile,
          name: patchFile,
          previewUrl: `/patches/${category}/${patchFile.replace('.ips', '.png')}`,
        }));
        setPatches(patches);
      } catch (err) {
        console.error('Failed to load patches:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPatches();
  }, [category]);

  const handlePatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPatchId = event.target.value;
    const patch = patches.find((p) => p.id === selectedPatchId);
    if (patch) {
      setSelectedPatch(patch);
      onPatchSelect(patch);
    }
  };

  return (
    <div className="bg-gray-500 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{category} options</h3>
      <select
        className="w-full p-2 border border-gray-300 rounded-md"
        onChange={handlePatchChange}
      >
        <option value="">Select an option</option>
        {patches.map((patch) => (
          <option key={patch.id} value={patch.id}>
            {patch.name}
          </option>
        ))}
      </select>
      {selectedPatch && (
        <div className="mt-4">
          <h4 className="text-md font-medium">Preview:</h4>
          <img
            src={selectedPatch.previewUrl}
            alt={selectedPatch.name}
            className="w-full mt-2 rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default PatchSelector;