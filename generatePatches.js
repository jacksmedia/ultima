// generatePatches as ES not CommonJS, but bc
import { readdirSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = join(__dirname, 'public');
const patchesDir = join(publicDir, 'patches');

// --- Part 1: generate JSON manifests for /patches/ categories (ulti.tsx) ---
const categories = ['battle', 'map', 'portraits', 'game'];

categories.forEach((category) => {
  const categoryPath = join(patchesDir, category);
  const patchFiles = [];

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
  console.log(`Generated patches/${category}.json (${patchFiles.length} patches)`);
});

// --- Part 2: extract zips to /public/extracted/ (PlusPatcher & ClassicPatcher) ---

async function extractZip(zipFilename, outputSubdir) {
  const zipPath = join(publicDir, zipFilename);
  if (!existsSync(zipPath)) {
    console.warn(`  Skipping ${zipFilename} — file not found`);
    return [];
  }

  const outputDir = join(publicDir, 'extracted', outputSubdir);
  mkdirSync(outputDir, { recursive: true });

  const zipData = readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipData);
  const names = [];

  await Promise.all(
    Object.entries(zip.files).map(async ([, file]) => {
      if (file.dir || !file.name.toLowerCase().endsWith('.ips')) return;
      const originalName = file.name.split('/').pop();
      const content = await file.async('nodebuffer');
      writeFileSync(join(outputDir, originalName), content);
      names.push(originalName);
    })
  );

  names.sort();
  console.log(`  Extracted ${names.length} patches: ${zipFilename} → extracted/${outputSubdir}/`);
  return names;
}

const zipsToExtract = [
  { zip: 'FF4UP.zip',     dir: 'base-plus',   key: 'basePlus'     },
  { zip: 'FF4UC.zip',     dir: 'base-classic', key: 'baseClassic'  },
  { zip: 'Styles.zip',    dir: 'styles',       key: 'styles'       },
  { zip: 'Battles.zip',   dir: 'battles',      key: 'battles'      },
  { zip: 'Maps.zip',      dir: 'maps',         key: 'maps'         },
  { zip: 'Portraits.zip', dir: 'portraits',    key: 'portraits'    },
  { zip: 'Fonts.zip',     dir: 'fonts',        key: 'fonts'        },
  { zip: 'Tweaks.zip',    dir: 'tweaks',       key: 'tweaks'       },
];

console.log('\nExtracting zips to public/extracted/...');
const manifest = {};
for (const { zip, dir, key } of zipsToExtract) {
  manifest[key] = await extractZip(zip, dir);
}

mkdirSync(join(publicDir, 'extracted'), { recursive: true });
writeFileSync(
  join(publicDir, 'extracted', 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('\nWrote public/extracted/manifest.json');
