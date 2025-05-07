import { NextPage } from 'next';
import Layout from '@/layout';
import Image from "next/image";
import PlusPatcher from '@/components/PlusPatcher';

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
      <PlusPatcher />
    </Layout>
  );
};
export default HomePage;
