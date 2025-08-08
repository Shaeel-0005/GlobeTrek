import React from "react";
import { SignIn } from "../pages/index";



const Navbar = () => {
  return (
    <section className="navbar flex items-center justify-between px-8 py-4 text-black bg-trnasparent backdrop-blur-md">
      <div className="navbar-logo text-xl font-bold">MyLogo</div>

      <ul className="navbar-links flex flex-row gap-7 list-none text-black ">
        <li>
          <a href="#home" className="no-underline  hover:text-blue-400">
            HOME
          </a>
        </li>
        <li>
          <a href="#journal" className="no-underline hover:text-blue-400">
            JOURNAL
          </a>
        </li>
        <li>
          <a href="#exploreWorld" className="no-underline  hover:text-blue-400">
            EXPLORE WORLD
          </a>
        </li>
      </ul>

      <div className="navbar-button">
        <button
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition text-white"
         
        >
          <S/>
        </button>
      </div>
    </section>
  );
};

export default Navbar;
