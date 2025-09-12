import React from "react";
import { Hero, HowItWorks } from "../section/index";
import {Navbar} from "../components/index";

const Homepage = () => {
  return (
    <>
   
    <div className="w-full overflow-x-hidden">
      <Hero />
    
      <HowItWorks />
    </div>
    </>
  );
};

export default Homepage;
