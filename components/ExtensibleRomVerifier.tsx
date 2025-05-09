import React, { useState, useRef } from 'react';
import Image from "next/image";

export interface RomValidationRule {
  validateFile: (file: File, fileData: ArrayBuffer) => Promise<boolean>;
  errorMessage: string;
}

export interface RomVerifierProps {
  onValidRom: (romFile: File) => void;
  validationRules?: RomValidationRule[];
  acceptedExtensions?: string[];
  title?: string;
  description?: string;
}

const ExtensibleRomVerifier: React.FC<RomVerifierProps> = ({ 
  onValidRom, 
  validationRules = [],
  acceptedExtensions = ['.sfc', '.smc'],
  title = "Drop your ROM file here or",
  description = "Supported formats: .sfc, .smc"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const processFile = async (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);
    setIsProcessing(true);
    
    // Check file extension
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!acceptedExtensions.includes(fileExt)) {
      setErrorMessage(`Please select a valid ROM file (${acceptedExtensions.join(', ')})`);
      setIsProcessing(false);
      return;
    }

    // Process validation rules if any
    if (validationRules.length > 0) {
      try {
        // Read the file as ArrayBuffer for validations that need content
        const fileBuffer = await file.arrayBuffer();
        
        // Check all validation rules
        for (const rule of validationRules) {
          const isValid = await rule.validateFile(file, fileBuffer);
          if (!isValid) {
            setErrorMessage(rule.errorMessage);
            setIsProcessing(false);
            return;
          }
        }
      } catch (error) {
        setErrorMessage('Error processing file: ' + (error instanceof Error ? error.message : String(error)));
        setIsProcessing(false);
        return;
      }
    }
    
    // If we got here, the file passed all validations
    setIsProcessing(false);
    onValidRom(file);
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
        accept={acceptedExtensions.join(',')}
        className="hidden-input"
      />
      
      <div className='p-2'>
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
            {title}
          </p>
        )}
        
        {errorMessage && (
          <p className="mb-2 text-sm text-red-400">
            {errorMessage}
          </p>
        )}
        
        <button
          onClick={handleBrowseClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Browse Files'}
        </button>
        
        <p className="mt-2 text-xs text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ExtensibleRomVerifier;