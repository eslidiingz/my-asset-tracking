export function PortfolioChart() {
  return <div className="relative mt-6 h-48 w-full overflow-hidden sm:h-56" aria-label="Portfolio value chart showing an upward trend">
    <div className="absolute inset-0 chart-grid" />
    <svg viewBox="0 0 700 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" role="img">
      <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c8ff52" stopOpacity=".3"/><stop offset="1" stopColor="#c8ff52" stopOpacity="0"/></linearGradient></defs>
      <path d="M0,143 C45,137 65,149 105,124 C145,99 170,122 211,108 C250,95 278,111 321,76 C355,48 391,83 430,69 C469,55 493,72 533,43 C573,14 611,48 650,25 C670,14 686,12 700,15 L700,180 L0,180Z" fill="url(#fill)"/>
      <path d="M0,143 C45,137 65,149 105,124 C145,99 170,122 211,108 C250,95 278,111 321,76 C355,48 391,83 430,69 C469,55 493,72 533,43 C573,14 611,48 650,25 C670,14 686,12 700,15" fill="none" stroke="#c8ff52" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
      <circle cx="700" cy="15" r="5" fill="#c8ff52" stroke="#0e110d" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
    </svg>
    <div className="absolute bottom-0 flex w-full justify-between text-[10px] font-semibold text-muted"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div>
  </div>;
}
