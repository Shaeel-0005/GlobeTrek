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
      <div className="hero-content flex flex-col items-center justify-center text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to GlobeTrek</h1>
        <p className="text-lg mb-8">
          Explore the world with us. Discover new places, cultures, and adventures.
        </p>
        <div className="hero-images flex gap-4">
          <img src={Hero01} alt="Hero 1" className="w-32 h-32 rounded-lg" />
          <img src={Hero02} alt="Hero 2" className="w-32 h-32 rounded-lg" />
          <img src={Hero03} alt="Hero 3" className="w-32 h-32 rounded-lg" />
        </div>
    </section>
  );
};

export default Hero;
