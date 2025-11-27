import Image from "next/image";

const ClassicTitle = () => {
  return(
    <a target="_blank" href="https://ff4ultima-plus.vercel.app/classic.html">
      <Image
        className=""
        src="/img/classicTitle.png"
        alt="FF4 Ultima logo"
        width={256}
        height={224}
        priority
      />
    </a>
  );
};
export default ClassicTitle;