import { NextPage } from 'next';
import MainPage from '@/components/MainPage';
import Head from 'next/head';

const IndexPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>FF4Ultima ROM Patcher</title>
        <meta name="description" content="Patch your Final Fantasy IV ROM with FF4Ultima" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <MainPage />
    </>
  );
};

export default IndexPage;