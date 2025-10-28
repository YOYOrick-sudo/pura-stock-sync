const WaveBackground = () => {
  return (
    <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden">
      <svg
        className="w-full h-[500px]"
        viewBox="0 0 1440 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Bottom layer - Sunrise (light orange) */}
        <path
          d="M0,250 C240,320 480,180 720,240 C960,300 1200,200 1440,260 L1440,0 L0,0 Z"
          className="fill-accent/20"
        />
        {/* Middle layer - Sky (mint green) */}
        <path
          d="M0,180 C320,260 560,140 840,190 C1120,240 1320,160 1440,200 L1440,0 L0,0 Z"
          className="fill-muted/30"
        />
        {/* Top layer - Sea (teal) with more organic curves */}
        <path
          d="M0,120 C360,200 520,80 780,140 C1040,200 1280,100 1440,140 L1440,0 L0,0 Z"
          className="fill-primary/15"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
