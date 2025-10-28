const WaveBackground = () => {
  return (
    <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden">
      <svg
        className="w-full"
        viewBox="0 0 1440 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,160 C320,280 480,100 720,160 C960,220 1120,100 1440,160 L1440,0 L0,0 Z"
          className="fill-primary/10"
        />
        <path
          d="M0,200 C360,300 600,150 900,200 C1200,250 1320,180 1440,200 L1440,0 L0,0 Z"
          className="fill-primary/20"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
