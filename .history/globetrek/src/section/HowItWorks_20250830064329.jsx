import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Capture",
    desc: "Document your journeys with photos and notes.",
    icon: "📸",
  },
  {
    title: "Relive",
    desc: "Scroll back through your adventures with ease.",
    icon: "🌍",
  },
  {
    title: "Share",
    desc: "Inspire others by sharing your stories.",
    icon: "✨",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative bg-gray-50 py-32">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
          How It Works
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Simple steps to turn your journeys into timeless memories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="p-8 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl hover:shadow-2xl transition relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, scale: 1.02 }}
          >
            <div className="text-5xl mb-6">{step.icon}</div>
            <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
            <p className="text-gray-600">{step.desc}</p>

            {/* gradient glow border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 hover:opacity-20 transition" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
