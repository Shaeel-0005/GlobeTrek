import React from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";
import { motion } from "framer-motion";

const Hero = () => {
  const paragraphs = [
    {
      text: "One day, your memories will be more valuable than your passport stamps.",
      img: Hero01,
    },
    {
      text: "Save your stories. See your journeys.",
      img: Hero02,
    },
    {
      text: "Relive your adventures on a map of memories.",
      img: Hero03,
    },
  ];

  return (
    <div className="scroll-smooth bg-gradient-to-b from-white via-gray-50 to-gray-100 text-[#2E2E2E]">
      {/* Navbar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative h-[300vh] flex flex-col items-center">
        {/* Sticky Heading */}
        <div className="sticky top-28 z-20 flex items-center justify-center h-40">
          <h1 className="text-[2.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-bold tracking-tighter text-center">
            EVERY JOURNEY’S STORY.
          </h1>
        </div>

        {/* Storytelling Paragraphs */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center gap-[50vh] px-6">
          {paragraphs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -150 : 150 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className={`relative max-w-xl p-6 rounded-xl ${
                i % 2 === 0 ? "self-start text-left" : "self-end text-right"
              }`}
            >
              {/* Background Accent Image */}
              <img
                src={item.img}
                alt="story accent"
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm rounded-xl"
              />
              <div className="relative z-10 bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
                <p className="text-lg sm:text-xl md:text-2xl italic font-light">
                  {item.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gray-100 relative">
        <h2 className="text-4xl sm:text-5xl font-bold mb-12 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-6xl">
          {["Create", "Save", "Relive"].map((title, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, rotate: i === 1 ? 1 : -1 }}
              whileTap={{ scale: 0.97 }}
              className="relative bg-white/20 backdrop-blur-lg border border-white/40 shadow-xl 
              rounded-2xl p-8 flex flex-col items-center justify-center text-center 
              cursor-pointer transition hover:shadow-2xl"
            >
              {/* Accent Circle */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white 
              flex items-center justify-center rounded-full mb-4 text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{title}</h3>
              <p className="text-gray-700">
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
