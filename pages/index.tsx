import { NextPage } from 'next';
import Layout from '@/layout';
import PlusPatcher from '@/components/PlusPatcher';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg container-fluid'>
        <div className='row'>
          <h1 className='d-flex col-12 justify-content-center'>FF4 Ultima Plus Patcher</h1>
        </div>
        <PlusPatcher />
        {/* row styling exists in above component*/}
      </div>
    </Layout>
  );
};
export default HomePage;
