import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { applyIPS } from '@/lib/patcher';
import Layout from '@/layout';
import SpinnerOverlay from '@/components/SpinnerOverlay';

const GIMMICK_MESSAGES = [
  '"Hot sprites in your area"',
  '"Gimmick shamelessly stolen from Terraria"',
  '"Now with ???% more jokes"',
  '"Gee, it sure is boring around here"',
  '"Am I really going to monopolize these? – Asked Guysons"',
  '"Guysons was here"',
  '"This site is sponsored by the game-artwork channel in the FF4 Ultima Discord"',
  '"As much fun as summoning every resident of Feymarch at once"',
  '"Just as much QoL as a convenience store!"',
  '"Also listen to Legião Urbana!"',
  '"Join the FF4 Ultima Discord for fresh sprites and stale GIFs"',
  '"Kain is a simp tho, fr"',
  '"Unofficially endorsed by Dr. Lugae"'
];

const CATEGORIES = [
  { id: 'map sprites', title: 'Map Sprites' },
  { id: 'portraits', title: 'Portraits' },
  { id: 'town & dungeon maps', title: 'Town & Dungeon Maps' },
  { id: 'world maps', title: 'World Maps' },
  { id: 'monsters', title: 'Monsters' },
  { id: 'battle bgs', title: 'Battle Backgrounds' },
  { id: 'mechanics', title: 'Mechanics' },
] as const;

type CategoryManifests = Record<string, string[]>;

export const getStaticProps: GetStaticProps<{ manifests: CategoryManifests }> = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const manifests: CategoryManifests = {};
  for (const cat of CATEGORIES) {
    const manifestPath = path.join(process.cwd(), 'public/indev', cat.id, 'manifest.json');
    try {
      manifests[cat.id] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      manifests[cat.id] = [];
    }
  }

  return { props: { manifests } };
};

const InDev = ({ manifests }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [gimmick, setGimmick] = useState('');
  const [romFile, setRomFile] = useState<File | null>(null);
  const [romData, setRomData] = useState<Uint8Array | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [manifest, setManifest] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGimmick(GIMMICK_MESSAGES[Math.floor(Math.random() * GIMMICK_MESSAGES.length)]);
  }, []);

  const handleRomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRomFile(file);
    setError(null);
    setDownloadUrl(null);
    setManifest([]);

    const buffer = await file.arrayBuffer();
    let data = new Uint8Array(buffer);
    if (data.length % 1024 === 512) {
      data = data.slice(512);
    }
    if (data.length < 2 * 1024 * 1024) {
      const expanded = new Uint8Array(2 * 1024 * 1024);
      expanded.set(data);
      data = expanded;
    }
    setRomData(data);
  };

  const handleSelectionChange = async (categoryId: string, value: string) => {
    setSelections(prev => ({ ...prev, [categoryId]: value }));
    setDownloadUrl(null);
    setManifest([]);

    if (!value) {
      setPreviewUrl(null);
      setPreviewName(null);
      return;
    }

    const pngPath = `/indev/${categoryId}/${encodeURIComponent(value.replace(/\.ips$/i, '.png'))}`;
    try {
      const res = await fetch(pngPath, { method: 'HEAD' });
      if (res.ok) {
        setPreviewUrl(pngPath);
        setPreviewName(value.replace(/\.ips$/i, ''));
      } else {
        setPreviewUrl(null);
        setPreviewName(value.replace(/\.ips$/i, ''));
      }
    } catch {
      setPreviewUrl(null);
      setPreviewName(value.replace(/\.ips$/i, ''));
    }
  };

  const handlePatch = async () => {
    if (!romData) {
      setError('Please upload a ROM file first.');
      return;
    }

    const selectedPatches = Object.entries(selections).filter(([, v]) => v);
    if (selectedPatches.length === 0) {
      setError('No patches selected.');
      return;
    }

    setIsPatching(true);
    setError(null);

    try {
      let patched = new Uint8Array(romData);
      const appliedManifest: string[] = [];

      for (const [categoryId, patchFile] of selectedPatches) {
        const url = `/indev/${categoryId}/${encodeURIComponent(patchFile)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${patchFile}`);
        const patchData = new Uint8Array(await res.arrayBuffer());
        patched = applyIPS(patched, patchData) as Uint8Array<ArrayBuffer>;
        appliedManifest.push(patchFile);
      }

      const blob = new Blob([patched], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setManifest(appliedManifest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply patches.');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>FF4 Ultima In-Dev Patches | Test New Graphics</title>
        <meta name="description" content="Help test in-development graphics patches for FF4 Ultima - map sprites, portraits, battle backgrounds, and more." />
      </Head>

      {isPatching && <SpinnerOverlay />}

      <div className="indev-bg min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-around items-end gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">In Development</h1>
              <h1 className="text-3xl font-bold mb-2">FF4 Ultima In-Dev Patches</h1>
              <h3 className="text-lg text-gray-300">Help us test new graphics options!</h3>
            </div>
            <div className="text-pink-300 italic text-sm md:text-base md:text-right">
              {gimmick}
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-4 mb-6">
            <p className="text-pink-200 mb-4">
              Upload your FF4 Ultima ROM, select some options, then choose &quot;Apply Patches&quot;.
              You&apos;ll see a manifest of your choices and a link to download the patched ROM. These might even work with other Final Fantasy 4 romhacks, but we can't guarantee it!
            </p>
            <div className="flex gap-8 text-sm text-gray-300">
              <div>
                <p className="font-semibold mb-1">Abbreviations:</p>
                <ul className="list-disc list-inside">
                  <li>WS = WonderSwan</li>
                  <li>BE = Brave Exvius</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-6 text-sm">
            <strong>Note:</strong> Except for the monster graphics color enhancer, these are all in-development patches
            and not considered finished. Please share bug reports in the <strong>#game-artwork</strong> channel in{' '}
            <a href="https://discord.gg/PGMASbSnD9" target="_blank" rel="noreferrer" className="text-pink-300 underline">
              the Ultima Discord
            </a>!
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">ROM File (.sfc or .smc):</label>
            <input
              type="file"
              accept=".sfc,.smc"
              onChange={handleRomUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700"
            />
            {romFile && <p className="text-sm text-green-400 mt-1">Loaded: {romFile.name}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Select Patches</h4>
              <div className="space-y-3">
                {CATEGORIES.map(cat => (
                  <div key={cat.id}>
                    <label className="block text-sm text-gray-300 mb-1">{cat.title}:</label>
                    <select
                      value={selections[cat.id] || ''}
                      onChange={e => handleSelectionChange(cat.id, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="">(default - no change)</option>
                      {manifests[cat.id]?.map(patch => (
                        <option key={patch} value={patch}>{patch.replace(/\.ips$/i, '')}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div
                className="w-full max-w-sm aspect-square bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ minHeight: '300px' }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt={previewName || 'Preview'} className="image-fluid object-contain" />
                ) : (
                  <span className="text-gray-400">No preview available</span>
                )}
              </div>
              {previewName && <p className="text-sm text-gray-300 mt-2 text-center">{previewName}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-red-200">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <button
              onClick={handlePatch}
              disabled={!romData || isPatching}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              {isPatching ? 'Applying...' : 'Apply Patches'}
            </button>
          </div>

          {manifest.length > 0 && (
            <div className="bg-slate-800/80 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-2">Applied Patches:</h4>
              <ul className="list-disc list-inside text-sm text-gray-300 mb-4">
                {manifest.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="FF4 Ultima Plus Test.sfc"
                  className="inline-block bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold transition-colors"
                >
                  Download Patched ROM
                </a>
              )}
            </div>
          )}

          <hr className="border-slate-600 my-6" />

          <div className="text-center text-sm text-gray-400">
            <p>
              Special thanks to <strong>Gedankenschild</strong> for creating these color-expanding hacks,
              and to <strong>epigonone</strong> for cleaning up the map sprite palettes & importing new
              field and battle graphics!
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .indev-bg {
          background: linear-gradient(90deg, black, #4e044e, black);
          background-size: 200% 200%;
          animation: bgColorShift 42s ease infinite;
        }
        .image-fluid {
          width: auto;
          height: 100%;
        }
        @keyframes bgColorShift {
          0% { background-position: 10% 0%; }
          50% { background-position: 91% 100%; }
          100% { background-position: 10% 0%; }
        }
      `}</style>
    </Layout>
  );
};

export default InDev;
