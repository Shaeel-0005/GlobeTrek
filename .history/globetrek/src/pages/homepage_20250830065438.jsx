import React from "react";
import {Navbar} from "../components/index";

const Homepage = () => {
  return (
    <>
    <Navbar/>
    import React, { useState, useEffect } from 'react';


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

// Storytelling Component
const Storytelling = () => {
  const [visibleBlocks, setVisibleBlocks] = useState(new Set());

  useEffect(() => {
    const observers = [];
    
    const observerCallback = (entries, blockIndex) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleBlocks(prev => new Set([...prev, blockIndex]));
        }
      });
    };

    // Create observers for each block
    [0, 1, 2].forEach(index => {
      const observer = new IntersectionObserver(
        (entries) => observerCallback(entries, index),
        { threshold: 0.3 }
      );
      
      const element = document.querySelector(`#story-block-${index}`);
      if (element) {
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => observers.forEach(observer => observer.disconnect());
  }, []);

  const storyBlocks = [
    {
      title: "The Call to Adventure",
      text: "Every great story begins with a single step into the unknown. Feel the mountain air fill your lungs as you embark on a journey that will transform your perspective forever.",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop&crop=entropy&auto=format",
      reverse: false
    },
    {
      title: "Moments of Wonder",
      text: "Discover hidden gems along ancient trails where time seems to stand still. Each bend reveals new mysteries, from pristine lakes reflecting sky to forests whispering ancient secrets.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=entropy&auto=format",
      reverse: true
    },
    {
      title: "Stories by the Fire",
      text: "As stars emerge overhead, gather around the warmth of shared experiences. These moments of connection under the vast cosmos become the stories you'll treasure most.",
      image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&h=400&fit=crop&crop=entropy&auto=format",
      reverse: false
    }
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="sticky top-8 mb-20 text-center z-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Every Journey's Story
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto" />
        </div>

        <div className="space-y-32">
          {storyBlocks.map((block, index) => (
            <div 
              key={index}
              id={`story-block-${index}`}
              className={`grid lg:grid-cols-2 gap-12 items-center ${block.reverse ? 'lg:grid-flow-col-dense' : ''}`}
            >
              {/* Text Content */}
              <div 
                className={`space-y-6 ${block.reverse ? 'lg:col-start-2' : ''}`}
                style={{
                  opacity: visibleBlocks.has(index) ? 1 : 0,
                  transform: `translateY(${visibleBlocks.has(index) ? 0 : 60}px)`,
                  transition: 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)'
                }}
              >
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {block.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {block.text}
                </p>
              </div>

              {/* Image */}
              <div 
                className={`relative ${block.reverse ? 'lg:col-start-1' : ''}`}
                style={{
                  opacity: visibleBlocks.has(index) ? 1 : 0,
                  transform: `translateY(${visibleBlocks.has(index) ? 0 : 80}px)`,
                  transition: 'all 1s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  transitionDelay: '0.2s'
                }}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img 
                    src={block.image}
                    alt={block.title}
                    className="w-full h-80 object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

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

// Main Landing Page Component
const LandingPage = () => {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Storytelling />
      <HowItWorks />
    </div>
  );
};

export default LandingPage;
    </>
  );
};

export default Homepage;
