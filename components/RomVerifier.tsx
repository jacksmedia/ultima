import React, { useState, useRef } from 'react';
import Image from "next/image";

interface RomVerifierProps {
  onMatch: (romFile: File) => void;
}

const RomVerifier: React.FC<RomVerifierProps> = ({ onMatch }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    
    // Only process .sfc, .smc, or .fig files
    const validExtensions = ['.sfc', '.smc'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      alert('Please select a valid SNES ROM file (.sfc or .smc)');
      return;
    }
    
    onMatch(file);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`
        w-full max-w-md p-8 border-2 border-dashed rounded-lg
        ${isDragging ? 'border-blue-500 bg-blue-950' : 'border-gray-600 bg-gray-900'}
        transition-colors flex flex-col items-center justify-center
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".sfc,.smc"
        className="hidden-input"
      />
      
      <div>
        <Image 
          src="/cloud-upload.svg"
          width={138}
          height={130}
          color="white"
          alt="cloud upload icon"
        />
        {fileName ? (
          <p className="mb-2 text-sm text-gray-300">
            Selected: <span className="font-semibold">{fileName}</span>
          </p>
        ) : (
          <p className="mb-2 text-sm text-gray-400">
            Drop your ROM file here or
          </p>
        )}
        
        <button
          onClick={handleBrowseClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Browse Files
        </button>
        
        <p className="mt-2 text-xs text-gray-500">
          Supported formats: .sfc, .smc
        </p>
      </div>
    </div>
  );
};

export default RomVerifier;