import {React,} from "react";
import { LoginModal } from "../pages/index";
import { Logo_H } from "../assets";



const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <section className="navbar flex items-center justify-between px-8 py-4 text-black bg-trnasparent backdrop-blur-md">
      <div className="navbar-logo text-xl font-bold h-[50px] w-auto">
  <img src={Logo_H} alt="Logo" className="h-full w-auto" />
</div>

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
        
          <SignIn/>
      
      </div>
    </section>
  );
};

export default Navbar;
