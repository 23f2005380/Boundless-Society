const Section = ({ children, svgFill, sectionHeading, headingStyle }) => {
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
    <div className={`relative text-black -mt-14`}>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          <path d={pathData} fill={svgFill} />
        </svg>
      </div>

      <div style={{ background: svgFill }} className={`pt-10 -mt-1 pb-20`}>
        <h1
          className={`mb-1 text-[9rem] max-md:text-8xl max-sm:text-6xl w-full font-[350] text-center font-oswald ${headingStyle}`}
        >
          {sectionHeading}
        </h1>
        {children}
      </div>
    </div>
  );
};

export default Section;
