import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";


const Hero = () => {
  const containertRef = useRef(null);
  const {scrollYProgress} = useScroll({
    target: containertRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress,[0,1],[])
  return (
    <>
      <div className="hero ">
        <Navbar />
      </div>
    </>
  );
};

export default Hero;
