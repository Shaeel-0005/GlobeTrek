// Navbar.jsx
import React from 'react';


const Navbar = () => {
  return (
    <nav className="navbar flex flex-row justify-between items-center p-4 bg-gray-800 text-white">
      <div className="navbar-logo">MyLogo</div>

      

      <div className="navbar-button">
        <button>Login</button>
      </div>
    </nav>
  );
};

export default Navbar;
