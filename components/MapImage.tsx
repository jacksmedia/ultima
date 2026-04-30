import Image from "next/image";

export interface MapImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const MapImage: React.FC<MapImageProps> = ({ src, alt, width, height }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      className="nicer-btn mx-auto"
      style={{
        width: '100%',
        maxWidth: '90vw',
        height: 'auto',
      }}
    />
  );
};

export default MapImage;
