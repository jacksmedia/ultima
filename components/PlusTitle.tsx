import Image from "next/image";

const PlusTitle = () => {
  return(
    <div className="flex justify-center items-center">
      <a target="_blank" href="https://ultima-plus.vercel.app/">
        <Image
            className="nicer-btn"
            src="/img/Title.png"
            alt="FF4 Ultima logo"
            width={256}
            height={224}
            priority
        />
      </a>
    </div>
  );
};
export default PlusTitle;