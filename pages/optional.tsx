import { NextPage } from 'next';

import Layout from '@/layout';
import Head from 'next/head';
import OptionalPatches from '@/components/OptionalPatches';



const Optional: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>FF4Ultima Optional Features | ROM Customizer</title>
        <meta name="description" content="Customize your FF4Ultima ROM with optional features" />
      </Head>
      
      <OptionalPatches />

    </Layout>
  );
};

export default Optional;