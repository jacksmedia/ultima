import { NextPage } from 'next';
import Layout from '@/layout';
import Head from 'next/head';
import Image from "next/image";
import OptionalPatches from '@/components/OptionalPatches';


const Optional: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>FF4Ultima Optional Features | ROM Customizer</title>
        <meta name="description" content="Customize your FF4Ultima ROM with optional features" />
      </Head>
      <div className='plus-optional-patcher-bg'>
        <h1 className="">FF4 Ultima Plus Optional Features</h1>
        <Image
            className=""
            src="/Title.png"
            alt="FF4 Ultima logo"
            width={256}
            height={224}
            priority
        />
        <OptionalPatches />
      </div>
    </Layout>
  );
};

export default Optional;