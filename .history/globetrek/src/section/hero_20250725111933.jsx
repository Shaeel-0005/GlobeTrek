import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";


const Hero = () => {
  return (
    <>
      <div className="hero ">
        <Navbar />
      </div>
    </>
  );
};

export default Hero;
