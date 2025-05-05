import { NextPage } from 'next';
import Layout from '@/Layout';
import Image from "next/image";
import MainPatcher from '@/components/MainPatcher';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-4">FF4 Ultima Patcher</h1>
      <Image
          className=""
          src="/Title.png"
          alt="FF4 Ultima logo"
          width={256}
          height={224}
          priority
      />
      <MainPatcher />
    </Layout>
  );
};
export default HomePage;
