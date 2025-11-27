import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";
import Map from "@/components/Map2";

const UnderworldMap: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <h1 className="">FF4 Ultima Underworld Map</h1>
          <BothTitles />
        <h3>Map created by Boomerang</h3>
        <h4>Labels by Lily</h4>
        <Map />
      </div>
     </Layout>
  );
};

export default UnderworldMap;