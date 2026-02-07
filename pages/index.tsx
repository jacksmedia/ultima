import { NextPage } from 'next';
import Layout from '@/layout';
import PlusPatcher from '@/components/PlusPatcher';
import Attribution from '@/components/Attribution';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg w-full'>
        <div className='flex flex-wrap'>
          <h1 className='flex w-full justify-center app-title'>FF4 Ultima Plus Patcher</h1>
        </div>
        <PlusPatcher />
        {/* row styling exists in above component*/}
        <Attribution />
      </div>
    </Layout>
  );
};
export default HomePage;
