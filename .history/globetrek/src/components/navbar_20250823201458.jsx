import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../pages/index"; // Changed: Removed curly braces for default import
import { Logo_H } from "../assets";

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="navbar flex items-center justify-between px-8 py-4 text-black bg-transparent backdrop-blur-md relative z-40">
      <div className="navbar-logo text-xl font-bold h-[50px] w-auto">
        <img src={Logo_H} alt="Logo" className="h-full w-auto" />
      </div>

      <ul className="navbar-links flex flex-row gap-7 list-none text-black">
        <li>
          <a href="#home" className="no-underline hover:text-blue-400 transition-colors">
            HOME
          </a>
        </li>
        <li>
          <a href="#journal" className="no-underline hover:text-blue-400 transition-colors">
            JOURNAL
          </a>
        </li>
        <li>
          <a href="#exploreWorld" className="no-underline hover:text-blue-400 transition-colors">
            EXPLORE WORLD
          </a>
        </li>
      </ul>

      <div className="navbar-button">
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
        
        <LoginModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSwitchToSignup={() => {
            setShowModal(false);
            navigate('/signup');
          }}
        />
      </div>
    </section>
  );
};

export default Navbar;