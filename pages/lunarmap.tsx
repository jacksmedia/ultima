import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";
import Map from "@/components/Map3";

const OverworldMap: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <h1 className="">FF4 Ultima Red Moon Map</h1>
          <BothTitles />
        <h3>Map created by Boomerang</h3>
        <h4>Labels by Lily</h4>
        <Map />
      </div>
     </Layout>
  );
};

export default OverworldMap;