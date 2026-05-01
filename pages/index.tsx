import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next';
import Head from 'next/head';
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
      <Head>
        <title>FF4 Ultima Plus Patcher | Create Your Custom ROM</title>
        <meta name="description" content="Patch your Final Fantasy IV ROM to create FF4 Ultima Plus with custom battle sprites, portraits, and visual styles." />
      </Head>
      <PlusPatcher manifest={manifest} />
    </Layout>
  );
};

export default HomePage;
