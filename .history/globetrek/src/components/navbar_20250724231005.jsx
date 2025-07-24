// Navbar.jsx
import React from 'react';


const Navbar = () => {
  return (
    <nav className="navbar flex flex-row justify-between items-center p-4 bg-gray-800 text-white">
      <div className="navbar-logo">MyLogo</div>

      <ul className="navbar-links flex flex-row space-x-4 list-none ">
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Journal</a></li>
        <li><a href="#pricing">Pricing</a></li>
      </ul>

      <div className="navbar-button">
        <button>Login</button>
      </div>
    </nav>
  );
};

export default Navbar;
