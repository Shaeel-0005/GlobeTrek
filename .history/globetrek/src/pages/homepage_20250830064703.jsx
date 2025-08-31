import React from "react";
import { Hero, HowItWorks, Storytelling } from "../section/index";
import {Navbar} from "../components/index";

const Homepage = () => {
  return (
    <>
    <Navbar/>
    <div className="w-full overflow-x-hidden">
      <Hero />
      <Storytelling />
      <HowItWorks />
    </div>
  );
};

export default Homepage;
