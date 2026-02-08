import { NextPage } from 'next';
import Layout from '@/layout';
import PlusPatcher from '@/components/PlusPatcher';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg text-center'>
        <div className='flex flex-wrap'>
          <h1 className='flex w-full justify-center app-title'>FF4 Ultima Plus Patcher</h1>
        </div>
        <PlusPatcher />
      </div>
    </Layout>
  );
};
export default HomePage;
