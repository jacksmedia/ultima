// components/FileUpload2.tsx
import React, { useState, useEffect } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onChecksumError: () => void;
}

const FileUpload2: React.FC<FileUploadProps> = ({ onFileUpload, onChecksumError }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      onFileUpload(uploadedFile);
    }
  };

  const verifyChecksum = (file: File) => {
    // Implement CRC32 verification logic here
    // For demonstration, we'll assume the checksum is always valid
    const isValid = true; // Replace with actual CRC32 verification
    if (!isValid) {
      onChecksumError();
    }
  };

  useEffect(() => {
    if (file) {
      verifyChecksum(file);
    }
  }, [file]);

  return (
    <div>
      <h3>Upload a binary file (.smc or .sfc)</h3>
      <input type="file" accept=".smc,.sfc" onChange={handleFileChange} />
    </div>
  );
};

export default FileUpload2;