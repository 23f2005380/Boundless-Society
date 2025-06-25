const Section = ({ children, svgStyle, sectionHeading }) => {
  const scallopCount = 15;
  const radius = 40;
  const svgWidth = scallopCount * radius * 2;
  const svgHeight = radius + 20;

  const scallops = Array.from({ length: scallopCount }, () => {
    return `a${radius},${radius} 0 0,1 ${radius},${radius}
            a${radius},${radius} 0 0,1 ${radius},-${radius}`;
  }).join(" ");

  const pathData = `M0,0 ${scallops} L${svgWidth},${svgHeight} L0,${svgHeight} Z`;

  return (
    <div className="relative bg-[#fefbe9] text-black">
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          <path d={pathData} className={svgStyle} />
        </svg>
      </div>

      <div className="pt-10 bg-black -mt-1 pb-20">
        <h1 className="mb-16 text-white text-9xl font-medium w-full text-center font-oswald">
          {sectionHeading}
        </h1>
        {children}
      </div>
    </div>
  );
};

export default Section;
