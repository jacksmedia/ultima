// code co-authored by Claude Sonnet 4
import React, { useState } from 'react';
import ImagePreviewModal from './ImagePreviewModal';

export interface OptionalPatch {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: Uint8Array;
  category?: string;
  previewImage?: string;
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
  onPreviewImage?: (imageSrc: string, title: string, description: string) => void;
  isDisabled?: boolean;
}

const CustomOptionsPanel: React.FC<CustomOptionsPanelProps> = ({
  categories,
  selectedPatches,
  onSelectionChange,
  onPreviewImage,
  isDisabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<{
    src: string;
    title: string;
    description: string;
  } | null>(null);

  const handlePreviewClick = (patch: OptionalPatch) => {
    if (patch.previewImage) {
      setModalImage({
        src: patch.previewImage,
        title: patch.name,
        description: patch.description
      });
      setModalOpen(true);
    }
  };

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
            ? 'text-gray cursor-not-allowed' 
            : 'text-white'
          }
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
      >
        <div className="flex items-center justify-between p-2">
          <span>Do You Want Custom Options?</span>
          <div className="flex items-center space-x-2">
            {getSelectedCount() > 0 && (
              <span className="px-2 py-1 text-sm">
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
                        flex items-start p-3 option-box
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
                        className={category.allowMultiple ? "hidden-checkbox" : "hidden-radio"}
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
                      {/* Preview button, loaded from public/previews */}
                      {patch.previewImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePreviewClick(patch);
                          }}
                          disabled={isDisabled}
                          className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Preview
                        </button>
                      )}
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

          {/* Image Preview Modal! */}
            {modalImage && (
              <ImagePreviewModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                imageSrc={modalImage.src}
                imageAlt={modalImage.title}
                title={modalImage.title}
                description={modalImage.description}
              />
            )}

        </div>
      )}
    </div>
  );
};

export default CustomOptionsPanel;