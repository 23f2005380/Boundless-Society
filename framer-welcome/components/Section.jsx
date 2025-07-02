import AnimatedByChar from "./AnimatedByWord";
import AnimatedByWord from "./AnimatedByWord";

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
    <div className={`relative text-black -mt-12 max-sm:-mt-6`}>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          <path d={pathData} fill={svgFill} />
        </svg>
      </div>

      <div style={{ background: svgFill }} className={`pt-15 -mt-1 pb-10`}>
        <h1
          className={`text-[9rem] max-md:text-8xl max-sm:text-6xl w-full font-[350] text-center font-oswald ${headingStyle}`}
        >
          {" "}
          <AnimatedByChar text={sectionHeading}>
            {sectionHeading}
          </AnimatedByChar>
        </h1>
        {children}
      </div>
    </div>
  );
};

export default Section;
