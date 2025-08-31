import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {LoginModal} from "../pages/index"; // Changed: Removed curly braces for default import
import { Logo_H } from "../assets";

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <section className="navbar flex items-center justify-between px-10 py-4 text-black bg-transparent backdrop-blur-md relative z-40">
        <div className="navbar-logo text-xl font-bold h-[50px] w-auto">
          <img src={Logo_H} alt="Logo" className="h-full w-auto" />
        </div>


        <div className="navbar-button">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
           <button 
            onClick={() => setShowModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </section>

      {/* Put modal OUTSIDE navbar so it overlays the entire page */}
      <LoginModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSwitchToSignup={() => {
          setShowModal(false);
          navigate('/signup');
        }}
      />
    </>
  );
};

export default Navbar;