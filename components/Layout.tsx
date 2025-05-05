// components/Layout.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/optional', label: 'Optional' },
  { href: '/discord', label: 'Discord' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <nav className="flex space-x-6 px-8 py-4 shadow-md">
        {navLinks.map(({ href, label }) => (
          <Link key={href} href={href} passHref>
            <span
              className={`cursor-pointer text-white hover:text-blue-400 transition-colors duration-200 ${
                router.pathname === href ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
};

export default Layout;
