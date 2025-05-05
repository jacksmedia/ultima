import { NextPage } from 'next';
import Layout from '@/components/Layout';
import Head from 'next/head';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>FF4 Ultima Patcher</title>
        <meta name="description" content="Get FF4 Ultima Plus" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">FF4 Ultima Patcher</h1>
      <p className="text-lg text-gray-300">
        Here you can upload a FFII or FFIV rom file (.sfc or .smc) and patch it into a copy of FF4 Ultima Plus.
      </p>
    </Layout>
  );
};
export default HomePage;
