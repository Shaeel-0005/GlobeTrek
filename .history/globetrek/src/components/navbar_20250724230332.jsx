// Navbar.jsx
import React from 'react';


const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">MyLogo</div>

      <ul className="navbar-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#about">About</a></li>
      </ul>

      <div className="navbar-button">
        <button>Login</button>
      </div>
    </nav>
  );
};

export default Navbar;
