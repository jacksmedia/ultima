import { NextPage } from 'next';
import Layout from '@/components/Layout';
import Head from 'next/head';
// import OptionalPatches from '@/components/OptionalPatches';


const Discord: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>FF4Ultima Optional Features | ROM Customizer</title>
        <meta name="description" content="Customize your FF4Ultima ROM with optional features" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <span>Join us in the <a href="https://discord.gg/PGMASbSnD9" target='blank'>FF4 Ultima Discord</a></span>
    </Layout>
  );
};

export default Discord;