import Image from "next/image";

const Map1 = () => {
  return(
    <Image
        className="nicer-btn w-4/5 h-dvh"
        src="/img/FF4_Ultima_Underworld_Map.png"
        alt="FF4 Ultima Underworld Map"
        width={2730}
        height={1365}
        priority
    />
  );
};
export default Map1;