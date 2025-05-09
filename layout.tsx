import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";

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
  { href: '/optional', label: 'Optional' },
  { href: '/guides', label: 'Guides' },
  { href: '/discord', label: 'Discord' }
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <html lang="en">
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" title="FF4 Ultima Patcher" />
        <link rel="icon" type="image/x-icon" href="/public/favicon.ico" />
      </Head>

      <body>
          <ul className="nav d-flex justify-content-center">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} passHref>
                <li
                  className={`nav-item  ${
                    router.pathname === href ? 'nav-link active' : 'nav-link'
                  }`}
                >
                  {label}
                </li>
              </Link>
            ))}
          </ul>
          <main className="d-flex justify-content-center">{children}</main>
        </body>
      </html>
  );
};

export default Layout;
