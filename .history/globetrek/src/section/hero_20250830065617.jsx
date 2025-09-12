import React, { useRef } from "react";
import { motion, useScroll,useuseTransform } from "framer-motion";

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lightingOffset = scrollY * 0.3;

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Cinematic lighting effect */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${50 + lightingOffset * 0.1}% ${30 + lightingOffset * 0.05}%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)`
        }}
      />
      
      <div className="relative z-10 flex items-center justify-center h-full px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div 
            className="space-y-8 text-center lg:text-left"
            style={{
              opacity: Math.max(0, 1 - scrollY * 0.003),
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Adventure
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Awaits
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl">
              Discover breathtaking landscapes and create memories that last a lifetime on your next epic journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
                Start Your Journey
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div 
            className="relative"
            style={{
              opacity: Math.max(0, 1 - scrollY * 0.002),
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=entropy&auto=format"
                alt="Mountain Adventure"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
