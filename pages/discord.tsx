import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ultima Discord</h1>
          <BothTitles />
          <h2>⬇</h2>
          <a href="https://discord.gg/PGMASbSnD9" target='blank'>
          <button
            className="nicer-btn-blue px-5 py-3 hover:bg-blue-700">
              Join us in the FF4 Ultima Discord
            </button>
          </a>
          <h2>⬆</h2>
      </div>
    </Layout>
  );
};

export default Discord;