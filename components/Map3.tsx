import Image from "next/image";

const Map1 = () => {
  return(
    <Image
        className="nicer-btn w-4/5 h-dvh"
        src="/img/FF4_Ultima_Moon_Map.png"
        alt="FF4 Ultima Moon Map"
        width={682}
        height={682}
        priority
    />
  );
};
export default Map1;