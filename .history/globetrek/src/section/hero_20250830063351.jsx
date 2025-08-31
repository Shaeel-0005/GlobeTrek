import React, { useRef } from "react";
import { Navbar } from "../components/index";
import { Hero01, Hero02, Hero03 } from "../assets/index";
import { motion, useScroll, useTransform } from "framer-motion";

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Lighting effect transforms
  const lightX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lightY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lightOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.5, 0.2]);

  // Parallax for storytelling images
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const paragraphs = [
    {
      text: "One day, your memories will be more valuable than your passport stamps.",
      img: Hero01,
      y: y1,
    },
    {
      text: "Save your stories. See your journeys.",
      img: Hero02,
      y: y2,
    },
    {
      text: "Relive your adventures on a map of memories.",
      img: Hero03,
      y: y1,
    },
  ];

  return (
    <div className="scroll-smooth bg-gradient-to-b from-white via-gray-50 to-gray-100 text-[#2E2E2E]">
      {/* Navbar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section
        ref={containerRef}
        className="relative h-[350vh] flex flex-col items-center overflow-hidden"
      >
        {/* Lighting Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${lightX} ${lightY}, rgba(255,255,200,0.4), transparent 70%)`,
            opacity: lightOpacity,
          }}
        />

        {/* Sticky Heading (no parallax) */}
        <div className="sticky top-28 z-20 flex items-center justify-center h-40">
          <h1 className="text-[2.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-extrabold tracking-tighter text-center">
            EVERY JOURNEY’S STORY.
          </h1>
        </div>

        {/* Storytelling Paragraphs w/ Parallax Images */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center gap-[70vh] px-6">
          {paragraphs.map((item, i) => (
            <motion.div
              key={i}
              className={`relative max-w-4xl flex items-center gap-6 ${
                i % 2 === 0 ? "self-start flex-row" : "self-end flex-row-reverse"
              }`}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              {/* Parallax Image */}
              <motion.img
                src={item.img}
                alt="story visual"
                style={{ y: item.y }}
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-xl"
                initial={{ scale: 0.85, rotate: i % 2 === 0 ? -5 : 5 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1 }}
              />
              <div className="relative z-10 bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-lg">
                <p className="text-lg sm:text-xl md:text-2xl italic font-light leading-relaxed">
                  {item.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-blue-50 to-indigo-100 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30 -top-10 -left-20"></div>
        <div className="absolute w-72 h-72 bg-blue-400 rounded-full blur-3xl opacity-30 bottom-0 right-0"></div>

        <h2 className="text-4xl sm:text-5xl font-extrabold mb-16 text-center text-gray-900">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-6xl z-10">
          {[
            {
              title: "Create",
              desc: "Start your first digital journal with ease.",
              img: Hero01,
            },
            {
              title: "Save",
              desc: "Keep your stories, photos, and memories in one place.",
              img: Hero02,
            },
            {
              title: "Relive",
              desc: "Replay your adventures with interactive maps.",
              img: Hero03,
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08, y: -12 }}
              whileTap={{ scale: 0.97 }}
              className="relative bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center cursor-pointer transition hover:shadow-2xl"
            >
              <motion.img
                src={card.img}
                alt={card.title}
                className="w-28 h-28 object-cover rounded-xl mb-6 shadow-md"
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
              <h3 className="text-2xl font-bold mb-3 text-gray-800">
                {card.title}
              </h3>
              <p className="text-gray-600">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Hero;
