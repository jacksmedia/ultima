import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next';
import fs from 'fs';
import path from 'path';
import Layout from '@/layout';
import PlusPatcher, { ExtractedManifest } from '@/components/PlusPatcher';

export const getStaticProps: GetStaticProps<{ manifest: ExtractedManifest }> = () => {
  const manifestPath = path.join(process.cwd(), 'public/extracted/manifest.json');
  const manifest: ExtractedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return { props: { manifest } };
};

const HomePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ manifest }) => {
  return (
    <Layout>
      <div className='plus-patcher-bg text-center h-screen'>
        <div className='flex flex-wrap'>
          <h1 className='flex w-full justify-center app-title'>FF4 Ultima Plus Patcher</h1>
        </div>
        <PlusPatcher manifest={manifest} />
      </div>
    </Layout>
  );
};

export default HomePage;
