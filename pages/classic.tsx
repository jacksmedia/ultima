import { NextPage } from 'next';
import Layout from '@/layout';
import ClassicPatcher from '@/components/ClassicPatcher';
import Attribution from '@/components/Attribution';

const Classic: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg container-fluid'>
        <div className='row'>
          <h1 className='d-flex col-12 justify-content-center app-title'>FF4 Ultima Patcher</h1>
        </div>
        <ClassicPatcher />
        {/* row styling exists in above component*/}
        <Attribution />
      </div>
    </Layout>
  );
};
export default Classic;
