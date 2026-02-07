import { NextPage } from 'next';
import Layout from '@/layout';
import ClassicPatcher from '@/components/ClassicPatcher';
import Attribution from '@/components/Attribution';

const Classic: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg w-full'>
        <div className='flex flex-wrap'>
          <h1 className='flex w-full justify-center app-title'>FF4 Ultima Patcher</h1>
        </div>
        <ClassicPatcher />
      </div>
    </Layout>
  );
};
export default Classic;
