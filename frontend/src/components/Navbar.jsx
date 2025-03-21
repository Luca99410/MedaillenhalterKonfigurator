// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import './Button.css';
import cartIcon from '../img/cart-icon.jpg';
import { CartContext } from '../contexts/CartContext';
import { ContactContext } from '../contexts/ContactContext';

const Navbar = () => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [hovered, setHovered] = useState(false);
  const navContainerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useContext(CartContext);
  const { loggedInUser, setLoggedInUser } = useContext(ContactContext);

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = navContainerRef.current.querySelector('.nav-link.active');
      if (activeLink) {
        setIndicatorStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [location]);

  // Handler zum Ausloggen
  const handleLogout = () => {
    setLoggedInUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner" ref={navContainerRef}>
        <div className="nav-left">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Startseite
          </NavLink>
          <NavLink
            to="/konfigurator"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Konfigurator
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            About
          </NavLink>
        </div>

        <div className="nav-right">
          {loggedInUser ? (
            <button
              className="button_navbar login-button"
              onClick={handleLogout}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {hovered ? "Ausloggen" : `${loggedInUser.firstName} ${loggedInUser.lastName}`}
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? 'button_navbar login-button active' : 'button_navbar login-button'
              }
            >
              Login
            </NavLink>
          )}
          <NavLink
            to="/warenkorb"
            className={({ isActive }) =>
              isActive ? 'nav-link navbar-cart active' : 'nav-link navbar-cart'
            }
          >
            <img src={cartIcon} alt="Cart" className="cart-icon" />
            <div className="nav-cart-count">{cartItems.length}</div>
          </NavLink>
        </div>
        <div className="nav-indicator" style={indicatorStyle}></div>
      </div>
    </nav>
  );
};

export default Navbar;
