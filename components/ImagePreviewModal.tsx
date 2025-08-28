// code authored by Claude Sonnet 4
import React, { useEffect, useState } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  imageAlt: string;
  title?: string;
  description?: string;
  manifestPath?: string; // optional path to manifest file
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  src,
  imageAlt,
  title,
  manifestPath
}) => {
  const [manifestContent, setManifestContent] = useState<string | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState(false);

  // Load manifest content when modal opens and manifestPath is provided
  useEffect(() => {
    if (!isOpen || !manifestPath) {
      setManifestContent(null);
      setManifestError(false);
      return;
    }

    const loadManifest = async () => {
      setLoadingManifest(true);
      setManifestError(false);
      
      try {
        console.log(`Loading manifest from: ${manifestPath}`);
        const response = await fetch(manifestPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load manifest: ${response.status}`);
        }
        
        const content = await response.text();
        setManifestContent(content);
        console.log('Manifest loaded successfully');
      } catch (error) {
        console.error('Error loading manifest:', error);
        setManifestError(true);
        setManifestContent(null);
      } finally {
        setLoadingManifest(false);
      }
    };

    loadManifest();
  }, [isOpen, manifestPath]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'scroll';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasManifest = manifestPath && !manifestError;
  console.log(manifestPath);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button, lightly animated w local CSS */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            {/* {description && <p>{description}</p>} maybe worthwhile, but manifest is better*/}
          </div>
        )}

        {/* Main content area: 2-column layout when manifest exists! */}
        <div className={`modal-content ${hasManifest ? 'with-manifest' : ''}`}>
          {/* Image container */}
          <div className="modal-image-container">
            <img
              src={src}
              alt={imageAlt}
              className="modal-image"
              onError={(e) => {
                console.error('Failed to load preview image:', src);
                e.currentTarget.src = '/placeholder-image.png'; // fallback image
              }}
            />
          </div>

          {/* .txt manifest container */}
          {hasManifest && (
            <div className="manifest-container">
              <div className="manifest-header">
                <h3>Credits & Attribution</h3>
              </div>
              <div className="manifest-content">
                {loadingManifest ? (
                  <div className="manifest-loading">
                    <div className="spinner"></div>
                    <p>Loading credits...</p>
                  </div>
                ) : manifestContent ? (
                  <div className="manifest-text">
                    {manifestContent.split('\\n').map((line, index) => (
                      <div key={index}>{line || '\\u00A0'}</div>
                      // forcing line breaks; <pre> element wasn't visible so can't be used
                    ))}
                  </div>
                ) : (
                  <p className="manifest-error">Unable to load credits information</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with filename */}
        <div className="modal-footer">
          <small>{imageAlt}</small>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 8999;
          padding: 8px;
          box-sizing: border-box;
        }

        .modal-container {
          position: relative;
          background: linear-gradient(#444,#444,#533608);
          border-radius: 12px;
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          overflow: overlay;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-close-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.2);
          border: 3px #ae7517 solid;
        }

        .modal-header {
          padding: 4px 8px 4px 8px;
          border-bottom: 1px solid #666666;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 8px 0;
          color: #e5e5e5;
          font-size: 1.1rem;
        }

        .modal-header p {
          margin: 0;
          color: #ddd;
          font-size: 0.85rem;
        }

        /* main content container */
        .modal-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr;
          min-height: 0;
          overflow: scroll;
        }

        .modal-content.with-manifest {
          grid-template-columns: 60% 40%; /* Two columns with manifest */
          gap: 0;
        }

        .modal-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          overflow: hidden;
          grid-column: 1;
        }

        .modal-content.with-manifest .modal-image-container {
          grid-column: 1;
          padding-right: 10px;
        }

        .modal-image {
          width: 300%;
          max-width: 90vw;
          height: 300%;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: black;
        }

        .modal-content.with-manifest .modal-image {
          max-width: 100%;
          max-height: 70vh;
        }

        /* optional manifest */
        .manifest-container {
          display: flex;
          flex-direction: column;
          grid-column: 2;
          background: rgba(0, 0, 0, 0.3);
          border-left: 1px solid #666;
          overflow: overlay;
        }

        .manifest-header {
          padding: 15px 20px 10px 20px;
          border-bottom: 1px solid #666;
          background: rgba(0, 0, 0, 0.2);
        }

        .manifest-header h3 {
          margin: 0;
          color: #e5e5e5;
          font-size: 1.1rem;
          text-align: center;
        }

        .manifest-content {
          flex: 1;
          padding: 15px 20px;
          overflow-y: overlay;
          overflow-x: hidden;
          min-height: 0; /* needed for flex shrinking */
          max-height: 100%; /* locked to parent element */
        }

        .manifest-text {
          color: white;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          max-width: 100%;
          display: block;
          box-sizing: border-box;
        }
        .manifest-text div {
          margin: 0;
          padding: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .manifest-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: #ccc;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #666;
          border-top: 2px solid #ae7517;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .manifest-error {
          color: #ff9999;
          font-style: italic;
          text-align: center;
          margin: 20px 0;
        }

        .modal-footer {
          padding: 10px 20px;
          background: #555555;
          border-top: 1px solid #666666;
          text-align: center;
          color: #666;
        }

        /* mobile responsive display */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-container {
            max-width: 98vw;
            max-height: 98vh;
          }

          .modal-content.with-manifest {
            flex-direction: column;
          }

          .modal-content.with-manifest .modal-image-container {
            flex: 0 0 50%;
            padding-right: 20px;
          }

          .manifest-container {
            flex: 0 0 50%;
            border-left: none;
            border-top: 1px solid #666;
          }
          
          .modal-header {
            padding: 15px 15px 8px 15px;
          }
          
          .modal-header h2 {
            font-size: 1.25rem;
          }
          
          .modal-image-container {
            padding: 15px;
          }
          
          .modal-close-btn {
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
          }

          .manifest-text {
            font-size: 0.75rem;
          }
        }

        /* ensures modal appears above everything */
        .modal-overlay {
          backdrop-filter: blur(4px);
        }

        /* scrollbar for manifest */
        .manifest-content::-webkit-scrollbar {
          width: 6px;
        }

        .manifest-content::-webkit-scrollbar-track {
          background: #333;
        }

        .manifest-content::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 3px;
        }

        .manifest-content::-webkit-scrollbar-thumb:hover {
          background: #888;
        }
      `}</style>
    </div>
  );
};

export default ImagePreviewModal;