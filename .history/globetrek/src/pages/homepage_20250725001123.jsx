import React from "react";
import { Hero } from "../section/index";
import 
const Homepage = () => {
  return (
    <div
      className="section h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('/img/homepage.jpg')` }}
    >
      <Hero />
    </div>
  );
};

export default Homepage;
