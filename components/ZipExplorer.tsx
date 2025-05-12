import JSZip from 'jszip';
import { useEffect, useState } from 'react';
// import Image from "next/image";

// Define tree node shape
type TreeNode = {
  name: string;
  children?: TreeNode[];
  isFolder: boolean;
  fullPath: string;
};

// Build nested tree from flat paths
function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  paths.forEach((path) => {
    const segments = path.split('/');
    let currentLevel = root;

    segments.forEach((segment, index) => {
      const existing = currentLevel.find((node) => node.name === segment);

      if (existing) {
        currentLevel = existing.children!;
      } else {
        const fullPath = segments.slice(0, index + 1).join('/');
        const newNode: TreeNode = {
          name: segment,
          isFolder: index < segments.length - 1,
          children: index < segments.length - 1 ? [] : undefined,
          fullPath,
        };
        currentLevel.push(newNode);
        if (newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  return root;
}

// Recursive tree renderer with image previews
function TreeView({ nodes }: { nodes: TreeNode[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setOpen((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <ul className="pl-4">
      {nodes.map((node) => (
        <li key={node.fullPath} className="mb-2">
          {node.isFolder ? (
            <div>
              <button
                onClick={() => toggle(node.fullPath)}
                className="text-white hover:text-blue-400 font-semibold"
              >
                {open[node.fullPath] ? '📂' : '📁'} {node.name}
              </button>
              {open[node.fullPath] && node.children && (
                <TreeView nodes={node.children} />
              )}
            </div>
          ) : (
            <div className="text-white hover:text-blue-400 ml-4">
              {node.name.endsWith('.ips') && (
                <div className="mb-2 text-center">
                  <div className="w-32 h-32 mx-auto relative mb-1">
                    <img
                      src={`/${node.fullPath.replace(/\.ips$/, '.png')}`}
                      alt={`Preview for ${node.name}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded border border-white"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none'; // hide on error
                      }}
                    />
                  </div>
                </div>
              )}
              📄 {node.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ZipExplorer() {
  const [tree, setTree] = useState<TreeNode[]>([]);

  useEffect(() => {
    async function loadZip() {
      try {
        const res = await fetch('./Final Fantasy 4 Ultima Plus patch archive.zip');
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);

        const paths: string[] = [];
        zip.forEach((relativePath) => {
          if (!relativePath.endsWith('/')) paths.push(relativePath);
        });

        setTree(buildTree(paths));
      } catch (err) {
        console.error('Failed to parse zip:', err);
      }
    }

    loadZip();
  }, []);

  return (
    <div className="">
      <h2 className="mb-4 text-white text-xl font-bold">📦 Patch Archive Explorer</h2>
      <TreeView nodes={tree} />
    </div>
  );
}
