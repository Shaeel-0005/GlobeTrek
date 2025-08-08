import React from "react";
// import { motion, useScroll, useTransform } from "framer-motion";
// import { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  return (
    <section className="hero flex flex-col items-center justify-center h-screen
    ">
      <img
      src={Hero01}
      alt="Hero Background"
      className="absolute top-0 left-0 w-full h-24  opacity-50"
      />
      <div className="nav w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      <div className="hero-content flex flex-row items-center justify-center h-full w-full px-8">
        <div className="left-content flex flex-col  items-start justify-end h-[60vh] w-[20%]">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!</p>
          <button className="bg-blue-600 text-white p-2"  ><a href="#">Explore World</a></button>
        </div>

        <div className="heading flex flex-col item-center justify-center text-black bottom-10 w-[70%] pr-10">
          <h1 className="text-center   text-[8rem] w-[60vw] leading-none pl-[20%]">HIKING/</h1>
          <h1 className="text-center text-[8rem] w-[60vw] leading-none pr-[10%]">TREKKING</h1>
          <h1 className="text-right text-[8rem]  w-[60vw] leading-none pr-10">TOURS</h1>
        </div>

        <div className="right-content flex flex-col items-start justify-end h-[35vh]  w-[20%] bottom-20">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!</p>
        </div>

      </div>

    </section>
  );
};

export default Hero;
