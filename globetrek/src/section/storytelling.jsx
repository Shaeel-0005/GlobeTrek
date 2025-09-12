// import React from "react";
// import { motion } from "framer-motion";
// import { useEffect, useState } from "react";


// const Storytelling = () => {
//   const [visibleBlocks, setVisibleBlocks] = useState(new Set());

//   useEffect(() => {
//     const observers = [];
    
//     const observerCallback = (entries, blockIndex) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           setVisibleBlocks(prev => new Set([...prev, blockIndex]));
//         }
//       });
//     };

//     // Create observers for each block
//     [0, 1, 2].forEach(index => {
//       const observer = new IntersectionObserver(
//         (entries) => observerCallback(entries, index),
//         { threshold: 0.3 }
//       );
      
//       const element = document.querySelector(`#story-block-${index}`);
//       if (element) {
//         observer.observe(element);
//         observers.push(observer);
//       }
//     });

//     return () => observers.forEach(observer => observer.disconnect());
//   }, []);

//   const storyBlocks = [
//     {
//       title: "The Call to Adventure",
//       text: "Every great story begins with a single step into the unknown. Feel the mountain air fill your lungs as you embark on a journey that will transform your perspective forever.",
//       image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop&crop=entropy&auto=format",
//       reverse: false
//     },
//     {
//       title: "Moments of Wonder",
//       text: "Discover hidden gems along ancient trails where time seems to stand still. Each bend reveals new mysteries, from pristine lakes reflecting sky to forests whispering ancient secrets.",
//       image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=entropy&auto=format",
//       reverse: true
//     },
//     {
//       title: "Stories by the Fire",
//       text: "As stars emerge overhead, gather around the warmth of shared experiences. These moments of connection under the vast cosmos become the stories you'll treasure most.",
//       image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&h=400&fit=crop&crop=entropy&auto=format",
//       reverse: false
//     }
//   ];

//   return (
//     <section className="py-24 px-6 bg-white">
//       <div className="max-w-6xl mx-auto">
//         <div className="sticky top-8 mb-20 text-center z-20">
//           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
//             Every Journey's Story
//           </h2>
//           <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto" />
//         </div>

//         <div className="space-y-32">
//           {storyBlocks.map((block, index) => (
//             <div 
//               key={index}
//               id={`story-block-${index}`}
//               className={`grid lg:grid-cols-2 gap-12 items-center ${block.reverse ? 'lg:grid-flow-col-dense' : ''}`}
//             >
//               {/* Text Content */}
//               <div 
//                 className={`space-y-6 ${block.reverse ? 'lg:col-start-2' : ''}`}
//                 style={{
//                   opacity: visibleBlocks.has(index) ? 1 : 0,
//                   transform: `translateY(${visibleBlocks.has(index) ? 0 : 60}px)`,
//                   transition: 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)'
//                 }}
//               >
//                 <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
//                   {block.title}
//                 </h3>
//                 <p className="text-lg text-gray-600 leading-relaxed">
//                   {block.text}
//                 </p>
//               </div>

//               {/* Image */}
//               <div 
//                 className={`relative ${block.reverse ? 'lg:col-start-1' : ''}`}
//                 style={{
//                   opacity: visibleBlocks.has(index) ? 1 : 0,
//                   transform: `translateY(${visibleBlocks.has(index) ? 0 : 80}px)`,
//                   transition: 'all 1s cubic-bezier(0.165, 0.84, 0.44, 1)',
//                   transitionDelay: '0.2s'
//                 }}
//               >
//                 <div className="relative overflow-hidden rounded-2xl shadow-2xl">
//                   <img 
//                     src={block.image}
//                     alt={block.title}
//                     className="w-full h-80 object-cover hover:scale-105 transition-transform duration-700"
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Storytelling;
