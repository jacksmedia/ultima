// code authored by Claude Sonnet 4
import React, { useEffect } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  title?: string;
  description?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
  description
}) => {
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
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
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
            {/* {description && <p>{description}</p>} */}
          </div>
        )}

        {/* Image container */}
        <div className="modal-image-container">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="modal-image"
            onError={(e) => {
              console.error('Failed to load preview image:', imageSrc);
              e.currentTarget.src = '/placeholder-image.png'; // Fallback image
            }}
          />
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
          z-index: 9999;
          padding: 20px;
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
          overflow: hidden;
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
          padding: 20px 20px 10px 20px;
          border-bottom: 1px solid #666666;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 8px 0;
          color: #e5e5e5;
          font-size: 1.5rem;
        }

        .modal-header p {
          margin: 0;
          color: #ddd;
          font-size: 0.95rem;
        }

        .modal-image-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          min-height: 0; /* Important for flex child to shrink */
          overflow: hidden;
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

        .modal-footer {
          padding: 10px 20px;
          background: #555555;
          border-top: 1px solid #666666;
          text-align: center;
          color: #666;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-container {
            max-width: 98vw;
            max-height: 98vh;
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
        }

        /* Ensure modal appears above everything */
        .modal-overlay {
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
};

export default ImagePreviewModal;