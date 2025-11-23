// multiple patches applied at once;
// "recipe" of patch choices config available for reuse
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload2';
import PatchSelector from '../components/PatchSelector';
import ConfigManager from '../components/ConfigManager';
import ApplyPatches from '../components/ApplyPatches';

const Ulti: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [config, setConfig] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setFile(file);
  };

  const handleChecksumError = () => {
    alert('Checksum verification failed.');
  };

  const handlePatchSelect = (patch: { id: string; category: string }) => {
    setSelectedPatches([...selectedPatches, `${patch.category}/${patch.id}`]);
  };

  const handleConfigUpload = (config: string) => {
    setConfig(config);
  };

  const handlePatchesApplied = () => {
    alert('Patches applied successfully.');
    // Implement logic to download the patched file
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Binary Patching Tool</h1>
      <FileUpload onFileUpload={handleFileUpload} onChecksumError={handleChecksumError} />
      {file && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <PatchSelector category="A" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'A' })} />
          <PatchSelector category="B" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'B' })} />
          <PatchSelector category="C" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'C' })} />
          <PatchSelector category="D" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'D' })} />
        </div>
      )}
      {file && (
        <div className="mt-4">
          <ConfigManager selectedPatches={selectedPatches} onConfigUpload={handleConfigUpload} />
          <ApplyPatches selectedPatches={selectedPatches} onPatchesApplied={handlePatchesApplied} />
        </div>
      )}
    </div>
  );
};

export default Ulti;