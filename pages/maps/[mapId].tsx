import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";
import MapImage from "@/components/MapImage";

interface MapConfig {
  title: string;
  description: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const MAP_DATA: Record<string, MapConfig> = {
  overworld: {
    title: 'FF4 Ultima Overworld Map',
    description: 'Complete overworld map of FF4 Ultima with all locations labeled.',
    src: '/img/FF4_Ultima_Overworld_Map.png',
    alt: 'FF4 Ultima Overworld Map',
    width: 2730,
    height: 2730,
  },
  underworld: {
    title: 'FF4 Ultima Underworld Map',
    description: 'Complete underworld map of FF4 Ultima with all locations labeled.',
    src: '/img/FF4_Ultima_Underworld_Map.png',
    alt: 'FF4 Ultima Underworld Map',
    width: 2730,
    height: 1365,
  },
  lunar: {
    title: 'FF4 Ultima Red Moon Map',
    description: 'Complete lunar/Red Moon map of FF4 Ultima with all locations labeled.',
    src: '/img/FF4_Ultima_Moon_Map.png',
    alt: 'FF4 Ultima Moon Map',
    width: 682,
    height: 682,
  },
};

interface MapPageProps {
  mapConfig: MapConfig;
}

const MapPage: NextPage<MapPageProps> = ({ mapConfig }) => {
  return (
    <Layout>
      <Head>
        <title>{mapConfig.title} | FF4 Ultima</title>
        <meta name="description" content={mapConfig.description} />
      </Head>
      <div className='guides-bg'>
        <h1>{mapConfig.title}</h1>
        <BothTitles />
        <h3>Map created by Boomerang</h3>
        <h4>Labels by Lily</h4>
        <MapImage
          src={mapConfig.src}
          alt={mapConfig.alt}
          width={mapConfig.width}
          height={mapConfig.height}
        />
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: Object.keys(MAP_DATA).map(mapId => ({ params: { mapId } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<MapPageProps> = async ({ params }) => {
  const mapId = params?.mapId as string;
  const mapConfig = MAP_DATA[mapId];

  if (!mapConfig) {
    return { notFound: true };
  }

  return { props: { mapConfig } };
};

export default MapPage;
