import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";


const Hero = () => {
  const containertRef = useRef(null);
  const {scrollYProgress} = useScroll({
    target:
  })
  return (
    <>
      <div className="hero ">
        <Navbar />
      </div>
    </>
  );
};

export default Hero;
