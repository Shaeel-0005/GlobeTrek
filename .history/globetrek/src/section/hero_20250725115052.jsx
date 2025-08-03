import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";

const Hero = () => {
  const containertRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containertRef,
    offset: ["start start", "end end"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `-100%`]);

  return (
    <>
      {/* <div className="hero ">
        <div className="nav fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

      </div> */}
    </>
  );
};

export default Hero;
