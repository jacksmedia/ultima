import { NextPage } from 'next';
import Layout from '@/layout';
import PlusTitle from "@/components/PlusTitle";
import SelectContainer1 from "@/components/SelectContainer1";
import SelectContainer2 from "@/components/SelectContainer2";
import SelectContainer3 from "@/components/SelectContainer3";


const Ulti: NextPage = () => {
  return (
    <Layout>      
      <div className='discord-bg'>
        <h1 className="">FF4 Ulti-Patcher</h1>
          <PlusTitle />
          <h2>Build a custom version of FF4 Ultima!</h2>
          <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '250px', flex: '1', padding: '1em' }}><SelectContainer1 /></div>
            <div style={{ maxWidth: '250px', flex: '1', padding: '1em' }}><SelectContainer2 /></div>
            <div style={{ maxWidth: '250px', flex: '1', padding: '1em' }}><SelectContainer3 /></div>
            </div>
          
          
      </div>
    </Layout>
  );
};

export default Ulti;



