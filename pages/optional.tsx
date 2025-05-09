import { NextPage } from 'next';
import Layout from '@/layout';
import Head from 'next/head';
import PlusTitle from "@/components/PlusTitle";
import OptionalPatches from '@/components/OptionalPatches';


const Optional: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>FF4 Ultima Optional Features | ROM Customizer</title>
        <meta name="description" content="Customize your FF4 Ultima ROM with optional features" />
      </Head>
      <div className='plus-optional-patcher-bg'>
        <h1 className="">FF4 Ultima Plus Optional Features</h1>
        <PlusTitle />
        <OptionalPatches />
      </div>
    </Layout>
  );
};

export default Optional;