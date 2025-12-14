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
    <div className="container mx-auto p-4 bg-indigo-800 h-screen">
      <h1 className="text-3xl font-bold mb-4">FF4 Ultima Options</h1>
      <h4>The "Ulti Patcher"</h4>
      <FileUpload onFileUpload={handleFileUpload} onChecksumError={handleChecksumError} />
      {file && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <PatchSelector category="battle" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'battle' })} />
          <PatchSelector category="map" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'map' })} />
          <PatchSelector category="portrait" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'portrait' })} />
          <PatchSelector category="game" onPatchSelect={(patch) => handlePatchSelect({ ...patch, category: 'game' })} />
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