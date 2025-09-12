import React from "react";
import { motion } from "framer-motion";

// HowItWorks Component
const HowItWorks = () => {
  const [visibleCards, setVisibleCards] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.dataset.cardIndex);
            setTimeout(() => {
              setVisibleCards(prev => new Set([...prev, cardIndex]));
            }, cardIndex * 200); // Stagger animation
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('.work-card').forEach(card => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      emoji: "🗺️",
      title: "Plan Your Route",
      description: "Choose from curated trails or create your own adventure path with our intelligent route planning system."
    },
    {
      emoji: "🎒",
      title: "Gear Up Smart",
      description: "Get personalized gear recommendations based on your destination, weather, and experience level."
    },
    {
      emoji: "🌟",
      title: "Create Memories",
      description: "Document your journey with integrated photo sharing and create lasting memories with fellow adventurers."
    }
  ];

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to transform your adventure dreams into unforgettable realities
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="work-card group cursor-pointer"
              data-card-index={index}
              style={{
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: `translateY(${visibleCards.has(index) ? 0 : 60}px) scale(${visibleCards.has(index) ? 1 : 0.95})`,
                transition: 'all 0.7s cubic-bezier(0.165, 0.84, 0.44, 1)'
              }}
            >
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-white/80 group-hover:to-blue-50/80">
                {/* Gradient border effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />
                
                <div className="text-center space-y-6">
                  {/* Emoji Icon */}
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {step.emoji}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default HowItWorks;
