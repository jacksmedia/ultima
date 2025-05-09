import { NextPage } from 'next';
import Layout from '@/layout';
import PlusTitle from "@/components/PlusTitle";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ultima Discord</h1>
          <PlusTitle />
        <h2><a href="https://discord.gg/PGMASbSnD9" target='blank'>Join us in the FF4 Ultima Discord</a></h2>
      </div>
    </Layout>
  );
};

export default Discord;