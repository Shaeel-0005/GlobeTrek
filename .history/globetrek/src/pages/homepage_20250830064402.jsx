import React from "react";
import Hero from "./Hero";
import Storytelling from "./Storytelling";
import HowItWorks from "./HowItWorks";

const Homepage = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />
      <Storytelling />
      <HowItWorks />
    </div>
  );
};

export default Homepage;
