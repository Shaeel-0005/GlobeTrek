import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // cinematic gradient light that moves on scroll
  const lightX = useTransform(scrollYProgress, [0, 1], ["30%", "70%"]);
  const lightY = useTransform(scrollYProgress, [0, 1], ["20%", "80%"]);
  const lightOpacity = useTransform(scrollYProgress, [0, 1], [0.4, 0.2]);

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-b from-white to-gray-100 overflow-hidden"
    >
      {/* Cinematic lighting effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${lightX} ${lightY}, rgba(255,200,150,0.5), transparent 70%)`,
          opacity: lightOpacity,
        }}
      />

      {/* Heading */}
      <div className="relative z-10 text-center max-w-3xl px-4">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-gray-900">
          Every Journey Tells a Story
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          Capture, relive, and share your adventures in a cinematic way.
        </p>
      </div>

      {/* Hero image */}
      <motion.img
        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
        alt="mountains"
        className="relative z-10 mt-10 w-full max-w-4xl rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </section>
  );
};

export default Hero;
