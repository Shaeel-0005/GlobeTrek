import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";


const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  return (
    <>
      <div className="hero ">
        <Navbar />
      </div>
    </>
  );
};

export default Hero;
