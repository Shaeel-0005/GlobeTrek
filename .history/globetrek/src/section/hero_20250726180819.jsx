import React from "react";
// import { motion, useScroll, useTransform } from "framer-motion";
// import { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  return (
    <section className="hero flex flex-col items-center justify-center h-screen">
      <div className="nav w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      <div className="hero-content flex flex-row items-center justify-center h-full w-full px-8">
        <div className="left-content flex flex-col items-start justify-end">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!</p>
          a<button ><a href="#"></a></button>
        </div>

      </div>

    </section>
  );
};

export default Hero;
