// takes the names of the patch files and
// generates a reusable "recipe" of the choices
import React from 'react';

interface ConfigManagerProps {
  selectedPatches: string[];
  onConfigUpload: (config: string) => void;
}

const ConfigManager: React.FC<ConfigManagerProps> = ({ selectedPatches, onConfigUpload }) => {
  const handleGenerateConfig = () => {
    const config = selectedPatches.join('\n');
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.txt';
    a.click();
  };

  const handleUploadConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const config = e.target.result as string;
          onConfigUpload(config);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <button className="bg-gray-500 p-4 rounded shadow-md m-2"
      onClick={handleGenerateConfig}>Generate Config</button>
      <input type="file" accept=".txt" onChange={handleUploadConfig} />
    </div>
  );
};

export default ConfigManager;