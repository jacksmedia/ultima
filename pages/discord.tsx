import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ultima Discord</h1>
          <BothTitles />
          <div>
            <a href="https://discord.gg/PGMASbSnD9" target='blank'>
            <button
              className="nicer-btn-blue exta-btn-spacing px-5 py-3 hover:bg-blue-700">
                Join us in the FF4 Ultima Discord
              </button>
            </a>
          </div>
      </div>
    </Layout>
  );
};

export default Discord;