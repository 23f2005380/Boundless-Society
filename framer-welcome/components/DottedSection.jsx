import AnimatedByChar from "./AnimatedByWord";
import AnimatedByWord from "./AnimatedByWord";

const DottedSection = ({
  children,
  svgFill,
  sectionHeading,
  headingStyle,
  dotColor,
}) => {
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

      <div style={{ background: svgFill }} className={`pt-15 -mt-1`}>
        <div className="relative w-full overflow-hidden -pb-10">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: `${dotColor}`,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M25 5 L30 20 L45 25 L30 30 L25 45 L20 30 L5 25 L20 20 Z' fill='%23a7f3d0'/%3E%3C/svg%3E")`,
              backgroundSize: "15px 15px",
              backgroundRepeat: "repeat",
              maskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
              WebkitMaskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
            }}
          />

          <div className="relative z-10 w-full pb-20">
            <h1
              className={`text-[9rem] max-md:text-8xl max-sm:text-6xl w-full font-[350] text-center font-oswald text-nowrap ${headingStyle}`}
            >
              {" "}
              <AnimatedByChar text={sectionHeading}>
                {sectionHeading}
              </AnimatedByChar>
            </h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DottedSection;
