import React, { useState, useEffect } from 'react';

interface PreviewContainerProps {
  selectedValue: string;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ selectedValue }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selectedValue) {
      setPreviewUrl(null);
      setPreviewName(null);
      setError(false);
      return;
    }

    const parts = selectedValue.replace(/\.ips$/i, '.png').split('/');
    const folder = parts.slice(0, -1).join('/');
    const filename = parts.slice(-1)[0];
    const safePath = `${folder}/${encodeURIComponent(filename)}`;

    const url = `patches/${safePath}`;

    fetch(url, { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          setPreviewUrl(url);
          setPreviewName(filename);
          setError(false);
        } else {
          setPreviewUrl(null);
          setError(true);
        }
      })
      .catch(() => {
        setPreviewUrl(null);
        setError(true);
      });
  }, [selectedValue]);

  return (
    <div
      id="preview-container"
      style={{
        minWidth: '256px',
        minHeight: '110px',
        width: '100%',
        height: 'auto',
        maxWidth: '256px',
        maxHeight: '110px',
        background: error ? '#888' : 'transparent',
        marginTop: '30px',
        marginBottom: '0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 500,
      }}
    >
      {previewUrl && (
        <img
          id="preview-image"
          src={previewUrl}
          alt="Patch preview"
          style={{
            objectFit: 'contain',
            width: '160%',
            height: 'auto',
            display: 'block',
          }}
        />
      )}
      {previewName && <h4 id="preview-name">{previewName}</h4>}
    </div>
  );
};

export default PreviewContainer;