import JSZip from 'jszip';
import { useEffect, useState } from 'react';

// Define tree node shape
type TreeNode = {
  name: string;
  children?: TreeNode[];
  isFolder: boolean;
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
        const newNode: TreeNode = {
          name: segment,
          isFolder: index < segments.length - 1,
          children: index < segments.length - 1 ? [] : undefined,
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

// Recursive f for tree rendering
function TreeView({ nodes }: { nodes: TreeNode[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setOpen((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <ul className="pl-4">
      {nodes.map((node) => (
        <li key={node.name}>
          {node.isFolder ? (
            <div>
              <button
                onClick={() => toggle(node.name)}
                className=""
              >
                {open[node.name] ? '📂' : '📁'} {node.name}
              </button>
              {open[node.name] && node.children && (
                <TreeView nodes={node.children} />
              )}
            </div>
          ) : (
            <span className="">
              🩹 {node.name}
            </span>
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
          // ignore empty folders? seems unneeded
          if (relativePath.endsWith('/')) return;
          paths.push(relativePath);
        });

        const builtTree = buildTree(paths);
        setTree(builtTree);
      } catch (err) {
        console.error('Failed to parse zip:', err);
      }
    }

    loadZip();
  }, []);

  return (
    <div className="">
      <h2 className="mb-4">📦 Patch Archive Explorer</h2>
      <TreeView nodes={tree} />
    </div>
  );
}
