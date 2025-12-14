import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/guides', label: 'Guides' },
  { href: 'https://ff4ultima-plus.vercel.app/classic.html', label: 'Ultima Classic' },
  { href: 'https://ff4ultima-plus.vercel.app/ulti.html', label: 'Custom' },
  { href: 'https://ff4ultima-plus.vercel.app/indev.html', label: 'In Dev.' },
  { href: '/patches', label: 'Patches' },
  { href: '/discord', label: 'Discord' }
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <html lang="en">
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" title="FF4 Ultima Patcher" />
        <link rel="icon" href="https://ultima-plus.vercel.app/img/favicon.png" sizes="any" />
      </Head>

      <body>
          <ul className="nav d-flex justify-content-center">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} passHref>
                <li
                  className={`nav-item  ${
                    router.pathname === href ? 'nav-l1nk active' : 'nav-l1nk'
                  }`}
                >
                  {label}
                </li>
              </Link>
            ))}
          </ul>
          <main>{children}</main>
        </body>
      </html>
  );
};

export default Layout;
