import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchPatches = async () => {
      try {
        const response = await fetch(`/patches/${category}/manifest.json`);
        const patchList = await response.json();
        const patches = patchList.map((patch: string) => ({
          id: patch,
          name: patch,
          previewUrl: `/patches/${category}/${patch.replace('.ips', '.png')}`,
        }));
        setPatches(patches);
      } catch (err) {
        console.error('Failed to load patches:', err);
      }
    };

    fetchPatches();
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
    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{category} Patches</h3>
      <select
        className="w-full p-2 border border-gray-300 rounded-md"
        onChange={handlePatchChange}
      >
        <option value="">Select a patch</option>
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