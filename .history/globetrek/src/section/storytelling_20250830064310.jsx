import React from "react";
import { motion } from "framer-motion";

const blocks = [
  {
    text: "One day, your memories will be more valuable than your passport stamps.",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    reverse: false,
  },
  {
    text: "Save your stories, see your journeys, and relive adventures on a map of memories.",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    reverse: true,
  },
  {
    text: "Your life’s story deserves to be told — beautifully and meaningfully.",
    img: "https://images.unsplash.com/photo-1499696010181-efc67b88d475",
    reverse: false,
  },
];

const Storytelling = () => {
  return (
    <section className="relative bg-white py-32">
      {/* Sticky heading */}
      <div className="sticky top-20 mb-20 text-center z-10">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
          Every Journey’s Story
        </h2>
      </div>

      <div className="space-y-40">
        {blocks.map((block, i) => (
          <motion.div
            key={i}
            className={`flex flex-col md:flex-row items-center gap-10 ${
              block.reverse ? "md:flex-row-reverse" : ""
            }`}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="flex-1 px-6">
              <p className="text-xl md:text-2xl text-gray-700">{block.text}</p>
            </div>
            <motion.img
              src={block.img}
              alt="story"
              className="flex-1 rounded-xl shadow-xl w-full max-w-lg"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Storytelling;
