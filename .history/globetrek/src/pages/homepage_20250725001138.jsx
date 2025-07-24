import React from "react";
import { Hero } from "../section/index";
import { Homeimg } from "../assets/index";
const Homepage = () => {
  return (
    <div
      className="section h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('')` }}
    >
      <Hero />
    </div>
  );
};

export default Homepage;
