// components/PatchButton.tsx
'use client';

import React, { useState } from 'react';

type PatchButtonProps = {
  romFile: File | null;
  patchFile: File | null;
  onPatch: () => void;
  disabled?: boolean;
};

export default function PatchButton({ romFile, patchFile, onPatch, disabled }: PatchButtonProps) {
  return (
    <button
      onClick={onPatch}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-bold transition-colors duration-300
        ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
    >
      Patch ROM
    </button>
  );
}

