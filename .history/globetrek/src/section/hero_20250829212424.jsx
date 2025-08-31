import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";
import na


const Hero = () => {
  return (
    <section className="hero relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Background Images */}
      <img
        src={Hero01}
        alt="snow image"
        className="absolute top-[15%] left-[19%] w-32 h-40 sm:w-40 sm:h-52 lg:w-50 lg:h-62"
      />
      <img
        src={Hero02}
        alt="boat image"
        className="absolute top-[20%] left-[80%] w-32 h-40 w-32 h-40 sm:w-40 sm:h-52 lg:w-50 lg:h-62"
      />
      <img
        src={Hero03}
        alt="hiking image"
        className="absolute top-[62%] left-[35%] w-32 h-40w-32 h-40 sm:w-40 sm:h-52 lg:w-50 lg:h-62"
      />

      {/* Navbar */}
      <div className="nav w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="hero-content flex flex-col md:flex-row items-center justify-center h-full w-full px-4 sm:px-8 md:px-12 z-10 gap-y-10 md:gap-y-0">
        {/* Left Text */}
        <div className="left-content flex flex-col items-start justify-end h-[30vh] md:h-[60vh] w-full md:w-[20%] text-center md:text-left px-4">
          <p className="text-sm sm:text-base">
            One day, your memories will be more valuable than your passport stamps.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700 transition">
            <a href="">Create Your First Journal</a>
            
          </button>
        </div>

        {/* Heading */}
        <div className="heading flex flex-col items-center justify-center w-full md:w-[60%] px-2 bottom-10 text-[#2E2E2E]">
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none text-right w-full">HIKING/</h1>
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none text-left w-full pr-8">TREKKING</h1>
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none text-center w-full pl-[45%]">TOURS</h1>
        </div>

        {/* Right Text */}
        <div className="right-content flex flex-col items-start justify-end h-[20vh] md:h-[35vh] w-full md:w-[20%] text-center md:text-right px-4">
          <p className="text-sm sm:text-base">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime rem ipsum accusamus!
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
