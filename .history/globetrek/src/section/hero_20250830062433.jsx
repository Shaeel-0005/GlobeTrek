import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
  const navigate = useNavigate();

  const paragraphs = [
    "One day, your memories will be more valuable than your passport stamps.",
    "Save your stories. See your journeys.",
    "Relive your adventures on a map of memories."
  ];

  return (
    <div className="scroll-smooth bg-white text-[#2E2E2E]">
      {/* Navbar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-[300vh]">
        {/* Fixed Heading */}
        <div className="sticky top-24 flex flex-col items-center justify-center w-full text-center z-10">
          <h1 className="text-[3rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-none tracking-tighter">
            EVERY JOURNEY’S STORY.
          </h1>
        </div>

        {/* Paragraphs (fade in alternately left/right) */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center gap-40 mt-96">
          {paragraphs.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className={`max-w-lg text-lg sm:text-xl md:text-2xl italic text-gray-600 px-6 text-center ${
                i % 2 === 0 ? "self-start" : "self-end"
              }`}
            >
              {text}
            </motion.p>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gray-50">
        <h2 className="text-4xl sm:text-5xl font-bold mb-12 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-6xl">
          {["Create", "Save", "Relive"].map((title, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, rotate: i === 1 ? 1 : -1 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white shadow-xl rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition"
            >
              <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center rounded-full mb-4 text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{title}</h3>
              <p className="text-gray-600">
                {i === 0 && "Start your first digital journal with ease."}
                {i === 1 && "Save stories, photos, and memories in one place."}
                {i === 2 && "Relive adventures anytime with interactive maps."}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Hero;
