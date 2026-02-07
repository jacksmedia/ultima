import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';


const navLinks = [
  { href: '/', label: 'Ultima Plus' },
  { href: '/guides', label: 'Guides' },
  { href: '/classic', label: 'Ultima Classic' },
  { href: 'https://ff4ultima-plus.vercel.app/ulti.html', label: 'Custom' },
  { href: 'https://ff4ultima-plus.vercel.app/indev.html', label: 'In Dev.' },
  { href: '/patches', label: 'Patches' },
  { href: '/discord', label: 'Discord' }
];

function NavBar() {
  const [navbar, setNavbar] = useState(false);
  const router = useRouter();

  return (
    <div>
      <nav className="w-full bg-black fixed top-0 left-0 right-0 z-10">
        <div className="justify-between px-4 mx-auto lg:max-w-7xl md:items-center md:flex md:px-8">
          <div>
            <div className="flex items-center justify-between py-3 md:py-5 md:block">
              {/* LOGO */}
              <Link href="/">
                <Image
                  src="/img/favicon.png"
                  width={30}
                  height={30}
                  alt="logo"
                  className="focus:border-none active:border-none"
                />
              </Link>
              {/* HAMBURGER BUTTON FOR MOBILE */}
              <div className="md:hidden">
                <button
                  className="p-2 text-gray-700 rounded-md outline-none focus:border-gray-400 focus:border"
                  onClick={() => setNavbar(!navbar)}
                >
                  {navbar ? (
                    <Image src="/close.svg" width={30} height={30} alt="logo" />
                  ) : (
                    <Image
                      src="/hamburger-menu.svg"
                      width={30}
                      height={30}
                      alt="logo"
                      className="focus:border-none active:border-none"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <div
              className={`flex-1 justify-self-center pb-3 mt-8 md:block md:pb-0 md:mt-0 ${
                navbar ? 'p-12 md:p-0 block' : 'hidden'
              }`}
            >
              <ul className="h-screen md:h-auto items-center justify-center md:flex ">
               
                {navLinks.map(({ href, label }) => (
                    <Link key={href} href={href} passHref onClick={() => setNavbar(!navbar)}>
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
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
