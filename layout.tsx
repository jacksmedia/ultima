import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/guides', label: 'Guides' },
  { href: '/classic', label: 'Ultima Classic' },
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
        <ul className="flex bg-black justify-center list-none p-0 m-0">
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
