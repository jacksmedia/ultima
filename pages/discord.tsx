import { NextPage } from 'next';
import Layout from '@/layout';
import Image from "next/image";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ultima Discord</h1>
          <Image
              className=""
              src="/Title.png"
              alt="FF4 Ultima logo"
              width={256}
              height={224}
              priority
          />
        <h2><a href="https://discord.gg/PGMASbSnD9" target='blank'>Join us in the FF4 Ultima Discord</a></h2>
      </div>
    </Layout>
  );
};

export default Discord;