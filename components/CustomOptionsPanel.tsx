// code authored by Claude Sonnet 4
import React, { useState } from 'react';

export interface OptionalPatch {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: Uint8Array;
  category?: string;
}

export interface PatchCategory {
  id: string;
  title: string;
  description?: string;
  patches: OptionalPatch[];
  allowMultiple?: boolean; // If false, radio button behavior; if true, checkbox behavior
}

interface CustomOptionsPanelProps {
  categories: PatchCategory[];
  selectedPatches: string[]; // Array of patch IDs
  onSelectionChange: (selectedPatchIds: string[]) => void;
  isDisabled?: boolean;
}

const CustomOptionsPanel: React.FC<CustomOptionsPanelProps> = ({
  categories,
  selectedPatches,
  onSelectionChange,
  isDisabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePatchToggle = (patchId: string, categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    let newSelection = [...selectedPatches];

    if (!category.allowMultiple) {
      // Radio button behavior - only one patch per category
      const categoryPatchIds = category.patches.map(p => p.id);
      newSelection = newSelection.filter(id => !categoryPatchIds.includes(id));
      
      if (!selectedPatches.includes(patchId)) {
        newSelection.push(patchId);
      }
    } else {
      // Checkbox behavior - multiple patches allowed
      if (selectedPatches.includes(patchId)) {
        newSelection = newSelection.filter(id => id !== patchId);
      } else {
        newSelection.push(patchId);
      }
    }

    onSelectionChange(newSelection);
  };

  const isPatchSelected = (patchId: string) => selectedPatches.includes(patchId);

  const getSelectedCount = () => selectedPatches.length;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isDisabled}
        className={`
          w-full px-6 py-4 rounded-lg font-medium text-lg transition-all
          ${isDisabled 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-700 hover:bg-blue-800 text-white'
          }
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span>Do You Want Custom Options?</span>
          <div className="flex items-center space-x-2">
            {getSelectedCount() > 0 && (
              <span className="px-2 py-1 bg-blue-900 rounded-full text-sm">
                {getSelectedCount()} selected
              </span>
            )}
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Options Panel */}
      {isExpanded && (
        <div className="bg-gray-800 border-2 border-t-0 border-blue-700 rounded-b-lg max-h-96 overflow-y-auto">
          <div className="p-4 space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="border-b border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {category.title}
                </h3>
                
                {category.description && (
                  <p className="text-gray-300 text-sm mb-3">
                    {category.description}
                  </p>
                )}

                <div className="space-y-2">
                  {category.patches.map((patch) => (
                    <label 
                      key={patch.id}
                      className={`
                        flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${isPatchSelected(patch.id) 
                          ? 'bg-blue-900 border border-blue-600' 
                          : 'bg-gray-700 hover:bg-gray-600'
                        }
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      <input
                        type={category.allowMultiple ? "checkbox" : "radio"}
                        name={category.allowMultiple ? undefined : `category-${category.id}`}
                        checked={isPatchSelected(patch.id)}
                        onChange={() => handlePatchToggle(patch.id, category.id)}
                        disabled={isDisabled}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {patch.name}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {patch.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          File: {patch.filename}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {category.patches.length === 0 && (
                  <p className="text-gray-400 italic">No options available in this category.</p>
                )}
              </div>
            ))}
          </div>

          {/* Clear All Button */}
          {getSelectedCount() > 0 && (
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => onSelectionChange([])}
                disabled={isDisabled}
                className="text-sm text-gray-300 hover:text-white underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear All Selections
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomOptionsPanel;