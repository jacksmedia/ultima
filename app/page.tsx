'use client'
import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainPage from '@/components/MainPage';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-800 text-white">
      <header className="bg-gray-900 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            FF4Ultima Patcher
          </Link>
          
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className={`hover:text-blue-400`}>
                  Main Patcher
                </Link>
              </li>
              <li>
                <Link href="/optional-patches" className={`hover:text-blue-400`}>
                  Optional Features
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4">
        <MainPage />
      </main>
      
      <footer className="bg-gray-900 p-4 text-center text-gray-400 text-sm">
        <div className="container mx-auto">
          <p>FF4Ultima ROM Patcher © {new Date().getFullYear()}. Final Fantasy is a registered trademark of Square Enix.</p>
          <p className="mt-1">This is a fan project and is not affiliated with or endorsed by Square Enix.</p>
        </div>
      </footer>
    </div>
  );
}

export default MyApp;