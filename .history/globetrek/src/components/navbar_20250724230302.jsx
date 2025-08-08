const Navbar = () => {
  return (
    <div className="navbar">
      <div className="logo">
        <img src="" alt="Logo" />
      </div>
      <div className="menu">
        <ul className="navbar-links">
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#features">Jounals</a>
          </li>
          <li>
            <a href="#pricing">Explore Worl</a>
          </li>
        </ul>
      </div>
      <div className="navbar-button">
        <button>Login</button>
      </div>
    </div>
  );
};

export default Navbar;
