import Image from "next/image";

const Map1 = () => {
  return(
    <Image
        className="nicer-btn w-4/5 h-dvh"
        src="/img/FF4_Ultima_Overworld_Map.png"
        alt="FF4 Ultima Overworld Map"
        width={2730}
        height={2730}
        priority
    />
  );
};
export default Map1;