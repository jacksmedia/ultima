import { NextPage } from 'next';
import Layout from '@/layout';
import Image from "next/image";
import PlusPatcher from '@/components/PlusPatcher';


const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg'>
        <h1 className="">FF4 Ultima Patcher</h1>
        <Image
            className=""
            src="/Title.png"
            alt="FF4 Ultima logo"
            width={256}
            height={224}
            priority
        />
        <PlusPatcher />
        </div>
    </Layout>
  );
};
export default HomePage;
