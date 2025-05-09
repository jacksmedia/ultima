import JSZip from 'jszip';
import { useEffect, useState } from 'react';

export default function ZipExplorer() {
  const [fileTree, setFileTree] = useState<string[]>([]);

  useEffect(() => {
    async function loadZip() {
      try {
        const res = await fetch('./FF4UP-Styles.zip');
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);

        const tree: string[] = [];
        zip.forEach((relativePath) => {
          tree.push(relativePath);
        });

        setFileTree(tree);
      } catch (err) {
        console.error('Failed to load or parse zip:', err);
      }
    }

    loadZip();
  }, []);

  return (
    <div className="p-4">
      <h2 className="mb-1">Optional Patches Available</h2>
      <ul className="">
        {fileTree.map((path) => (
          <li
            key={path}
            className=""
          >
            {path}
          </li>
        ))}
      </ul>
    </div>
  );
}
