import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `-100%`]);

  return (
    <>
      {/* <div className="hero ">
        

      </div> */}
      <section
        ref={containerRef}
        className="relative h-[200vh] overflow-hidden"
      >
        <div className="nav fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        {/* Sticky Title Text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="sticky top-[30vh] z-10 text-5xl md:text-7xl font-bold text-center pointer-events-none"
        >
          <h1>
            HIKING/
            <br />
            TREKKING
            <br />
            TOURS
          </h1>
        </motion.div>

        {/* Scrolling Layered Images */}
        <motion.div
          style={{ y }}
          className="absolute top-0 left-0 w-full h-screen"
        >
          <div className="relative w-full h-full">
            <img
              src={Hero01}
              alt="Snow"
              className="absolute top-10 left-10 w-[30%] rounded-lg shadow-md height-[30%] width-auto"
            />
            <img
              src={Hero02}
              alt="Venice"
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-[30%] rounded-lg shadow-md"
            />
            <img
              src={Hero03}
              alt="Hiker"
              className="absolute top-20 right-10 w-[30%] rounded-lg shadow-md"
            />
          </div>
        </motion.div>
        <div className="content w-full flex justify-between">

        </div>
      </section>
    </>
  );
};

export default Hero;
