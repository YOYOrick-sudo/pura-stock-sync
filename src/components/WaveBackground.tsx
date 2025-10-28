const WaveBackground = () => {
  return (
    <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden opacity-40">
      <svg
        className="w-full h-[300px]"
        viewBox="0 0 1440 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Single subtle wave */}
        <path
          d="M0,100 C360,160 720,60 1080,120 C1260,150 1380,100 1440,120 L1440,0 L0,0 Z"
          className="fill-primary/10"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
