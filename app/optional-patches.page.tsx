import { NextPage } from 'next';
import OptionalPatches from '@/components/OptionalPatches';
import Head from 'next/head';

const OptionalPatchesPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>FF4Ultima Optional Features | ROM Customizer</title>
        <meta name="description" content="Customize your FF4Ultima ROM with optional features" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <OptionalPatches />
    </>
  );
};

export default OptionalPatchesPage;