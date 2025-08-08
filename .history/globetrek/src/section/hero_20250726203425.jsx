import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center bg-cover bg-center overflow-hidden">
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 lg:px-20 text-black">
        <div className="flex flex-col lg:flex-row w-full justify-between items-center gap-10">
          {/* Left Text */}
          <div className="w-full lg:w-1/4 text-left space-y-6">
            <p className="text-sm sm:text-base">
              GLOBETREK LETS YOU TRACK COUNTRIES, SAVE MOMENTS, AND RELIVE YOUR TRAVEL STORIES IN ONE BEAUTIFUL PLACE.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
              EXPLORE WORLD
            </button>
          </div>

          {/* Center Headings with Images */}
          <div className="relative text-center w-full lg:w-2/4">
            {/* Images */}
            <img src={Hero01} alt="Snowy Mountain" className="absolute top-[-60px] left-[-60px] w-28 sm:w-32 md:w-40 z-[-1]" />
            <img src={Hero02} alt="Venice Boats" className="absolute top-[-60px] right-[-60px] w-28 sm:w-32 md:w-40 z-[-1]" />
            <img src={Hero03} alt="Backpacker" className="absolute bottom-[-60px] left-1/2 transform -translate-x-1/2 w-28 sm:w-32 md:w-40 z-[-1]" />

            <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] font-bold leading-none">HIKING/</h1>
            <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] font-bold leading-none">TREKKING</h1>
            <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] font-bold leading-none">TOURS</h1>
          </div>

          {/* Right Text */}
          <div className="w-full lg:w-1/4 text-right space-y-6">
            <p className="text-sm sm:text-base">
              GLOBETREK LETS YOU TRACK COUNTRIES, SAVE MOMENTS, AND RELIVE YOUR TRAVEL STORIES IN ONE BEAUTIFUL PLACE.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
