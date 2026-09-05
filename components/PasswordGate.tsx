// PasswordGate.tsx — client-side "convenience gate" for hiding a section behind a password.
//
// Wrap any subtree and it is rendered only after the visitor enters the right password:
//
//   <PasswordGate expectedHash={process.env.NEXT_PUBLIC_CUSTOM_OPTIONS_HASH ?? ''}>
//     <CustomOptionsPanel ... />
//   </PasswordGate>
//
// Setup (one time, by whoever deploys the app):
//   1. Generate the SHA-256 hex of the chosen password:
//        node -e "console.log(require('crypto').createHash('sha256').update('their-password').digest('hex'))"
//   2. Put it in .env.local (or the host's environment settings):
//        NEXT_PUBLIC_CUSTOM_OPTIONS_HASH=<hex output>
//   3. Rebuild. NEXT_PUBLIC_ values are inlined at build time, so changing the
//      password always means a rebuild.
//
// What this does and does not protect:
//   - The password itself is never shipped to the browser, only its SHA-256 hash.
//   - Anyone can still read the hash from the bundle and brute-force a weak password
//     offline, and anything under public/ (e.g. the .ips files) stays fetchable by URL.
//   - This is therefore a courtesy gate that keeps casual visitors out of a section,
//     not access control. For real protection the check has to move server-side and
//     the gated assets have to be served through a route that verifies it.
//
// Behaviour notes:
//   - An empty/missing expectedHash fails closed: the gate stays locked rather than
//     silently exposing the children on a misconfigured deploy.
//   - A successful unlock is remembered in sessionStorage for the life of the tab.
//     Storage is read after mount (not in the useState initializer) because reading
//     browser storage during server render would cause a hydration mismatch.
//   - Hashing uses the browser's built-in SubtleCrypto, which is only available in
//     secure contexts (https, or http://localhost). Plain http on a LAN IP will fail.
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'customOptionsUnlocked';

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface PasswordGateProps {
  /** SHA-256 hex digest of the password, baked in at build time. */
  expectedHash: string;
  /** Rendered only once the visitor has unlocked the gate. */
  children: React.ReactNode;
  /** Prompt shown above the input. */
  label?: string;
}

export default function PasswordGate({
  expectedHash,
  children,
  label = 'Custom Options are password protected',
}: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Restore a previous unlock for this tab. Comparing the stored hash to the
  // expected one means a rotated password invalidates old sessions automatically.
  useEffect(() => {
    try {
      if (expectedHash && sessionStorage.getItem(STORAGE_KEY) === expectedHash) {
        setUnlocked(true);
      }
    } catch {
      /* storage blocked (private mode, etc.): stay locked */
    }
  }, [expectedHash]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await sha256Hex(input.trim());
    if (expectedHash && hash === expectedHash) {
      try { sessionStorage.setItem(STORAGE_KEY, hash); } catch { /* non-critical */ }
      setError(null);
      setInput('');
      setUnlocked(true);
    } else {
      setError('Incorrect password.');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-2 mt-3">
      <label htmlFor="password-gate-input">{label}</label>
      <input
        id="password-gate-input"
        type="password"
        autoComplete="off"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="px-2 py-1 text-black rounded"
      />
      <button type="submit" className="px-2 py-2 text-white nicer-btn-blue">
        Unlock
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
