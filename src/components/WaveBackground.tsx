const WaveBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute top-0 w-full h-[400px] opacity-20"
        viewBox="0 0 1440 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Multiple layered waves */}
        <path
          d="M0,150 C360,200 720,100 1080,150 C1260,175 1380,150 1440,160 L1440,0 L0,0 Z"
          className="fill-[#E27726]"
          opacity="0.1"
        />
        <path
          d="M0,100 C360,160 720,60 1080,120 C1260,150 1380,100 1440,120 L1440,0 L0,0 Z"
          className="fill-[#E27726]"
          opacity="0.15"
        />
      </svg>
      <svg
        className="absolute bottom-0 w-full h-[400px] opacity-20 rotate-180"
        viewBox="0 0 1440 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C360,160 720,60 1080,120 C1260,150 1380,100 1440,120 L1440,0 L0,0 Z"
          className="fill-[#E27726]"
          opacity="0.08"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
