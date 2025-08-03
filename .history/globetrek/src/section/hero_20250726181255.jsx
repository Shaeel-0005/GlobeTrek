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
          <button className="bg-dark text-white p-2"  ><a href="#">Explore World</a></button>
        </div>

        <div className="heading flex flex-col items-center justify-center text-black ">
          <h1 className="text-center">HIKING/</h1>
          <h1 className="text-left">TREKKING</h1>
          <h1 className="text-right">TOURS</h1>
        </div>

        <div className="right-content flex flex-col items-start justify-end">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!</p>
        </div>

      </div>

    </section>
  );
};

export default Hero;
