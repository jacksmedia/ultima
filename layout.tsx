import Head from 'next/head';
import Navbar from "@/components/NavBar";
import Attribution from '@/components/Attribution';

const Layout = ({ children }: { children: React.ReactNode }) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" title="FF4 Ultima Patcher" />
        <link rel="icon" href="https://ultima-plus.vercel.app/img/favicon.png" sizes="any" />
      </Head>

      <Navbar />
      <main className="flex-1">{children}</main>
      <Attribution />
    </div>
  );
};

export default Layout;
