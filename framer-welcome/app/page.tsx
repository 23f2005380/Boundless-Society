import React from "react";
import Section from "@/components/Section";
import Image from "next/image";

function page() {
  return (
    <>
      <div>
        <Section svgStyle="bg-black" sectionHeading="Our Gallery">
          <div className="">
            <div
              className="bg-red-400 h-52 w-[120vw] text-white"
              style={{
                transform: "perspective(1200px) rotateX(20deg) rotateY(20deg)",
              }}
            >
              <Image
                alt=""
                src="/Gal1.jpg"
                width={300}
                className="h-auto w-auto"
              ></Image>
              <Image
                alt=""
                src="/Gal1.jpg"
                width={300}
                className="h-auto w-auto"
              ></Image>
              <Image
                alt=""
                src="/Gal1.jpg"
                width={300}
                className="h-auto w-auto"
              ></Image>
              <Image
                src="/Gal1.jpg"
                alt="Gallery"
                unoptimized
                priority
                width={1}
                height={1}
                style={{ height: "auto", width: "auto" }}
              />
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

export default page;
