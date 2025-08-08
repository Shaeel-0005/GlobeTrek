import React from "react";
import { Navbar } from "../components/index";
const Hero = () => {
  return (
    <>
      <div className="hero bg-gray-400 h-screen flex flex-col items-center justify-center text-white">
        <Navbar />
      </div>
    </>
  );
};

export default Hero;
