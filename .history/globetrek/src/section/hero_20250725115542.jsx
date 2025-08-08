import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01,Hero02,Hero03 } from "../assets/index";

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
        <div className="nav fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

      </div> */}
      <section ref={containerRef} className="relative h-[200vh] overflow-hidden">
      {/* Sticky Text */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="sticky top-[20vh] z-10 text-5xl md:text-7xl font-bold text-center pointer-events-none"
      >
        <h1>HIKING/<br />TREKKING<br />TOURS</h1>
      </motion.div>

      {/* Scrolling Images */}
      <motion.div style={{ y }} className="absolute top-0 left-0 w-full">
        <div className="space-y-8 px-4 max-w-4xl mx-auto mt-20">
          <img src={her} alt="Snow" className="w-full rounded-lg shadow-md" />
          <img src="/img2.jpg" alt="Venice" className="w-full rounded-lg shadow-md" />
          <img src="/img3.jpg" alt="Hiker" className="w-full rounded-lg shadow-md" />
        </div>
      </motion.div>
    </section>
    </>
  );
};

export default Hero;
