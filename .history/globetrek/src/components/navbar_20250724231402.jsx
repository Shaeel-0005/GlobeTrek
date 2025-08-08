import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar flex items-center justify-between px-8 py-4 bg-gray-800 text-white b">
      
      <div className="navbar-logo text-xl font-bold">
        MyLogo
      </div>

      <ul className="navbar-links flex flex-row gap-12 list-none">
        <li><a href="#home" className='no-underline text-white hover:text-blue-400'>Home</a></li>
        <li><a href="#journal" className='no-underline text-white hover:text-blue-400'>Journal</a></li>
        <li><a href="#exploreWorld" className='no-underline text-white hover:text-blue-400'>Explore World</a></li>
      </ul>

      
      <div className="navbar-button">
        <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition">
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
