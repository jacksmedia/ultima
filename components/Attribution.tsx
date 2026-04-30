const Attribution = () => {
    return(
    <>
      <div className='w-full block-inline bg-black px-1'>
          <p className="text-center text-sm p-6">Not endorsed by Square Enix, nor affiliated with them in any way. 
          Site built by <a href="https://jacks.media" rel="noopener noreferrer" target="_blank" className="special">Jacks.Media</a>, 2026.</p>
          
          <p className="text-center text-sm"><a target="_blank" href="https://icons8.com/icon/pfF6HpODcjW0/close">Menu</a> icons by <a target="_blank" href="https://icons8.com">Icons8</a></p>
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