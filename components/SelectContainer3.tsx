import React, { useEffect, useState } from 'react';
import PreviewContainer from './PreviewContainer';

interface PatchOption {
  value: string;
  text: string;
}

interface Folder {
  name: string;
  patches: PatchOption[];
}

const SelectContainer3: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const subfoldersResponse = await fetch('./patches/portrait-patches.json'); // Access JSON file with subfolder data
        const subfolders = await subfoldersResponse.json();

        const folderPromises = subfolders.map(async (folder: string) => {
          const patchListResponse = await fetch(`./patches/${folder}/manifest.json`);
          const patchList = await patchListResponse.json();

          return {
            name: folder,
            patches: patchList.map((patch: string) => ({
              value: `${folder}/${patch}`,
              text: patch,
            })),
          };
        });

        const folders = await Promise.all(folderPromises);
        setFolders(folders);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load folders and patches:', err);
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PreviewContainer selectedValue={selectedValue} />
        <div id="select-container3">
        {folders.map((folder, index) => (
            <div key={index} style={{ border: 'dotted 1px red', background: '#6663', padding: '3px', marginBottom: '5px' }}>
            <label style={{ display: 'block' }}>
                Style for &quot;{folder.name}&quot;:
            </label>
            <select
                id={`patch-select-${index}`}
                data-folder={folder.name}
                className="patch-select"
                style={{ margin: '2px', appearance: 'none', background: '#666a', color: 'black' }}
                onChange={(e) => handleSelectChange(e.target.value)}
            >
                <option value="">vanilla graphics</option>
                {folder.patches.map((patch, patchIndex) => (
                <option key={patchIndex} value={patch.value}>
                    {patch.text}
                </option>
                ))}
            </select>
            </div>
        ))}
        </div>
    </div>
  );
};

export default SelectContainer3;