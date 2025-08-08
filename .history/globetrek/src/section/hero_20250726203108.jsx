import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  return (
    <section className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Background Images */}
      <img
        src={Hero01}
        alt="Mountain scenery"
        className="absolute w-32 h-32 top-10 left-10 sm:w-40 sm:h-40 md:w-60 md:h-60"
      />
      <img
        src={Hero02}
        alt="Forest path"
        className="absolute w-32 h-32 top-1/2 left-[30%] sm:w-40 sm:h-40 md:w-60 md:h-60"
      />
      <img
        src={Hero03}
        alt="Trail view"
        className="absolute w-32 h-32 bottom-10 right-10 sm:w-40 sm:h-40 md:w-60 md:h-60"
      />

      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Content */}
      <div className="z-10 relative flex flex-col lg:flex-row items-center justify-between w-full h-full px-6 sm:px-12 lg:px-20">
        
        {/* Left Text */}
        <div className="mb-10 lg:mb-0 lg:w-1/4 text-left space-y-4">
          <p className="text-gray-700 text-sm sm:text-base">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
            <a href="#">Explore World</a>
          </button>
        </div>

        {/* Center Heading */}
        <div className="text-center lg:w-1/2">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none">HIKING/</h1>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none">TREKKING</h1>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none">TOURS</h1>
        </div>

        {/* Right Text */}
        <div className="mt-10 lg:mt-0 lg:w-1/4 text-right space-y-4">
          <p className="text-gray-700 text-sm sm:text-base">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
