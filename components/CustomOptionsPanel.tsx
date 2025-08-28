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
  const [modalProps, setModalProps] = useState<{
    src: string;
    title: string;
    description: string;
    manifestPath: string;
  } | null>(null);

  const handlePreviewClick = (patch: OptionalPatch) => {
  if (patch.previewImage) {
    // Creates manifest path for styles category
    const manifestPath = (patch.category === 'styles' || 
                     patch.category === 'battles' || 
                     patch.category === 'maps' || 
                     patch.category === 'portraits') 
      ? `/manifests/${patch.id}-manifest.txt`  // Pattern for patch.id matches manifest title
      : ``;
    console.log(`Generated ${manifestPath} for manifest text file name.`)
    setModalProps({
      src: patch.previewImage,
      title: patch.name,
      description: patch.description,
      manifestPath: manifestPath
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
    <div className="">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isDisabled}
        className={`
          px-2 py-2 mt-3 custom-options-button nicer-btn
          ${isDisabled 
            ? 'text-gray cursor-not-allowed' 
            : 'text-white'
          }
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
      >
        <div className="flex items-center justify-between p-2">
          <span>Want Custom Options?</span>
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
        <div className="">
          <div className="p-3 m-2">
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

                <div className="d-flex flex-row flex-wrap justify-content-evenly">
                  {category.patches.map((patch) => (
                    <label 
                      key={patch.id}
                      className={`
                        p-2 d-flex flex-column option-box
                        ${isPatchSelected(patch.id) 
                          ? 'chosen-box' 
                          : 'unchosen-box'
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
                      
                      <div className="">
                        <div className="font-medium text-white">
                          {patch.name}
                        </div>
                        {/* <div className="text-sm text-gray-300 mt-1">
                          {patch.description}
                        </div> */}
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
                          className="mx-auto px-2 py-2 text-white nicer-btn"
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
                className="mx-auto px-2 py-2 text-white nicer-btn"
              >
                Clear All Selections
              </button>
            </div>
          )}

          {/* Image Preview Modal! */}
            {modalOpen && modalProps && (
              <ImagePreviewModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                src={modalProps.src}
                imageAlt={modalProps.title}
                title={modalProps.title}
                manifestPath={modalProps.manifestPath}
                // description={modalProps.description} unused currently
              />
            )}

        </div>
      )}
    </div>
  );
};

export default CustomOptionsPanel;