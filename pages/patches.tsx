import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Patches: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ultima Patches</h1>
          <BothTitles />
        <h3>Here you can download all of the patches for FF4 Ultima.</h3>
        <p>Our community of hackers and spriters continually creates new options for this romhack.</p>
        <p>If you have any questions, feedback, or ideas, please join us in Discord!</p>
        <a href="./Final Fantasy 4 Ultima Plus patch archive.zip" target='blank'>
          <button
            className="nicer-btn px-5 py-3 hover:bg-blue-700"
          >
            Download
          </button>
        </a>
      </div>
    </Layout>
  );
};

export default Patches;