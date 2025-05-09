import { NextPage } from 'next';
import Layout from '@/layout';
import Image from "next/image";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <h1 className="">FF4 Ultima Guides</h1>
          <Image
              className=""
              src="/Title.png"
              alt="FF4 Ultima logo"
              width={256}
              height={224}
              priority
          />
        <h2>Guides written by LilyNo3 of Team Ultima</h2>
        <ul>
          <li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li>
        </ul>
      </div>
    </Layout>
  );
};

export default Discord;