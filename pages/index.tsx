import { NextPage } from 'next';
import Layout from '@/layout';
import PlusTitle from "@/components/PlusTitle";
import PlusPatcher from '@/components/PlusPatcher';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg'>
        <h1 className="">FF4 Ultima Patcher</h1>
        <PlusTitle />
        <PlusPatcher />
        </div>
    </Layout>
  );
};
export default HomePage;
