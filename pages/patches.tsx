import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Patches: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg text-center h-screen'>
        <h1 className="">FF4 Ultima Patches</h1>
        <BothTitles />
        <div className='p-3'>
          <h3>Here you can download all of the patches for FF4 Ultima.</h3>
          <p className="text-center">Our community of hackers and spriters continually creates new options for this romhack.</p>
          <p className="text-center">If you have any questions, feedback, or ideas, please join us in Discord!</p>
          <a href="./Final Fantasy 4 Ultima Plus patch archive.zip" target='blank'>
            <button
              className="nicer-btn-blue exta-btn-spacing px-5 py-3 hover:bg-blue-700"
            >
              Download
            </button>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Patches;