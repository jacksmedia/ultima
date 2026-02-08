const Attribution = () => {
    return(
    <>
      <div className='mt-5 w-full block-inline bg-black'>
          <p className="text-center">Not endorsed by Square Enix, and not affiliated with them in any way. 
          Site built by <a href="https://jacks.media" rel="noopener noreferrer" target="_blank" className="special">Jacks.Media</a>, 2025.</p>
          
          <p className="text-center"><a target="_blank" href="https://icons8.com/icon/pfF6HpODcjW0/close">Menu</a> icons by <a target="_blank" href="https://icons8.com">Icons8</a></p>
      </div>
      <style jsx>{`
        @keyframes special-text {
          0% {color: #80a;}
          50% {color: #f00;}
          100% {color: #80a;}
        }
        .special {
          color: #80a;
          animation-name: special-text;
          animation-duration: 3s;
          -moz-animation-duration: 3s;
          -webkit-animation-duration: 3s;
          animation-iteration-count: infinite;
          -moz-animation-iteration-count: infinite;
          -webkit-animation-iteration-count: infinite;
        }
      `}</style>
    </>
    );
};
export default Attribution;