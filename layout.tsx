import type { Metadata } from "next";
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";

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
export const metadata: Metadata = {
  title: "FF4 Ultima Patcher",
  description: "Play the Ultimate FFIV",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <html lang="en">
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" />
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
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
          <main className="p-2">{children}</main>
        </body>
      </html>
  );
};

export default Layout;
