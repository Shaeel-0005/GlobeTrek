import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  
  return (
  
    <section className="hero flex flex-col items-center justify-center h-screen">

      <div className="nav w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      <div className="heading">
        <h1>
          Welcome to GlobeTrek
        </h1>
      </div>
      <div className="content">
        <div className="left"><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio, deserunt! Architecto nihil nostrum, maiores ducimus, natus, quod officia dolore aperiam error praesentium tempora assumenda? Earum nemo repellat aut velit ab.</p></div>
        <div className="right"></div>
      </div>

    </section>
  );
};

export default Hero;
