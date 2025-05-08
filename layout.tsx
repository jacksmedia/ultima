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
  { href: '/discord', label: 'Discord' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <html lang="en">
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" title="FF4 Ultima Patcher" />
        <link rel="icon" type="image/x-icon" href="/public/favicon.ico" />
        {/* Bootstrap 5.3 for styling bc Tailwind is overrated */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa"></script>
      </Head>

      <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <nav className="d-flex justify-content-left">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} passHref>
                <span
                  className={`  ${
                    router.pathname === href ? '' : ''
                  }`}
                >
                  {label}
                </span>
              </Link>
            ))}
          </nav>
          <main className="d-flex justify-content-center">{children}</main>
        </body>
      </html>
  );
};

export default Layout;
