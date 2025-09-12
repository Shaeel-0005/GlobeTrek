import React from "react";
import { Hero, HowItWorks, Storytelling } from "../section/index";
import {nab}

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
