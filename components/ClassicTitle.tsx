import Image from "next/image";

const PlusTitle = () => {
  return(
    <Image
        className=""
        src="/img/classicTitle.png"
        alt="FF4 Ultima logo"
        width={256}
        height={224}
        priority
    />
  );
};
export default PlusTitle;