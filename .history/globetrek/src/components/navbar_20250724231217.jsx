// Navbar.jsx
import React from 'react';


const Navbar = () => {
  return (
    <nav className="navbar flex flex-row justify-between items-center p-4 bg-gray-800 text-white">
      <div className="navbar-logo">MyLogo</div>

      <ul className="navbar-links flex flex-row gap-10 list-none ">
        <li><a href="#home" className='no-underline text-white hover:text-blue-400'>Home</a></li>
        <li><a href="#journal"  className='no-underline text-white hover:text-blue-400'>Journal</a></li>
        <li><a href="#exploreWorld"  className='no-underline text-white hover:text-blue-400'>Explore World</a></li>
      </ul>

      <div className="navbar-button">
        <button>Login</button>
      </div>
    </nav>
  );
};

export default Navbar;
