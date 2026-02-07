// generatePatches as ES not CommonJS, but bc
import { readdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const patchesDir = join(__dirname, 'public', 'patches');

const categories = ['battle', 'map', 'portraits', 'game'];

categories.forEach((category) => {
  const categoryPath = join(patchesDir, category);
  const patchFiles = [];

  // Helper function to walk through directories
  const walkDirectory = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ips')) {
        patchFiles.push(relative(categoryPath, fullPath));
      }
    }
  };

  walkDirectory(categoryPath);
  writeFileSync(
    join(patchesDir, `${category}.json`),
    JSON.stringify(patchFiles, null, 2)
  );
});