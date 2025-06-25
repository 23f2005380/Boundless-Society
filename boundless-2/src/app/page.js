import Gallery from "@/components/Gallery";
import React from "react";
import About from "@/components/About";
import Prev from "@/components/Prev";

function page() {
  return (
    <>
      <div className="h-15"></div>
      <Gallery />
      <Prev />
      <About />
    </>
  );
}

export default page;
