import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="scroll smooth h-">

   
    <section className="hero relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Background Images */}
      <img
        src={Hero01}
        alt="snow image"
        className="absolute top-[27%] left-[24%] w-80 h-30 sm:w-70 sm:h-20 lg:w-110 lg:h-27 rounded-lg object-cover"
      />
      <img
        src={Hero02}
        alt="boat image"
        className="absolute top-[42%] left-[61%] w-32 h-40 sm:w-40 sm:h-52 lg:w-53 lg:h-35 rounded-lg object-cover"
      />
      <img
        src={Hero03}
        alt="hiking image"
        className="absolute top-[60%] left-[24%] w-32 h-40 sm:w-40 sm:h-52 lg:w-100 lg:h-26 rounded-lg object-cover"
      />

      {/* Navbar */}
      <div className="nav w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="hero-content flex flex-col md:flex-row items-center justify-center h-full w-full px-4 sm:px-8 md:px-12 z-10 gap-y-10 md:gap-y-0">
        {/* Left Text */}
        <div className="left-content flex flex-col items-start justify-end h-[30vh] md:h-[60vh] w-full md:w-[20%] text-center md:text-left px-4">
          <p className="text-base sm:text-lg text-gray-600 italic tracking-wide leading-relaxed max-w-md">
            One day, your memories will be more valuable than your passport
            stamps.
          </p>

          <button
            onClick={() => navigate("/signin")}
            className="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700 transition"
          >
            Create Your First Journal
          </button>
        </div>

        {/* Heading */}
        <div className="heading flex flex-col items-center justify-center w-full md:w-[60%] px-2 bottom-10 text-[#2E2E2E]">
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] tracking-tighter lg:text-[8rem] leading-none pr-12 text-right w-full">
            EVERY
          </h1>
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] tracking-tighter lg:text-[8rem] leading-none text-left w-full pr-8">
            JOURNEY'S
          </h1>
          <h1 className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] tracking-tighter lg:text-[8rem] leading-none text-center w-full pl-[45%]">
            STORY.
          </h1>
        </div>

        {/* Right Text */}
        <div className="right-content flex flex-col items-start justify-end h-[20vh] md:h-[35vh] w-full md:w-[20%] text-center md:text-right px-4">
          <p className="text-base sm:text-lg text-gray-600 italic tracking-wide leading-relaxed max-w-md">
            Save your stories.
            See your journeys.Relive your adventures on a map of
            memories.
          </p>
        </div>
      </div>
    </section>
     </div>
  );
};

export default Hero;
