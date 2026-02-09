import Image from "next/image";

const ClassicTitle = () => {
  return(
    <div className="flex justify-center items-center">
      <a target="_blank" href="https://ff4ultima-plus.vercel.app/classic.html">
        <Image
          className="blue-border"
          src="/img/classicTitle.png"
          alt="FF4 Ultima logo"
          width={256}
          height={224}
          priority
        />
      </a>
    </div>
  );
};
export default ClassicTitle;