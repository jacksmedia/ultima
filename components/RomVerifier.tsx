// RomVerifier.tsx developed with Claude Sonnet 4
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
      className={`w-100 text-center p-4 
        ${isDragging ? 'active-border' : 'passive-border'}
        dotted-border
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
      
      <div className=''>
        {/* <Image 
          src="/cloud-upload.svg"
          width={138}
          height={130}
          color="white"
          alt="cloud upload icon"
        /> */}
        {fileName ? (
          <p className="mb-5">
            Selected: <span className="font-semibold">{fileName}</span>
          </p>
        ) : (
          <h3 className="mb-5">
            Drop your ROM file here or
          </h3>
        )}
        
        <button
          onClick={handleBrowseClick}
          className="grid place-items-center px-4 py-2 mx-auto nicer-btn2">
          <h5>Upload a File</h5> 
          <Image 
            src="/cloud-upload.svg"
            width={42}
            height={39}
            color="white"
            alt="cloud upload icon"
          />
        </button>
        
        <p className="mt-2 text-xs">
          Supported formats: .sfc, .smc
        </p>
      </div>
    </div>
  );
};

export default RomVerifier;