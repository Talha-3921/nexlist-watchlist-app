import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';
import logo from '../assets/images/NEXELIST LOGO.png';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // Handle logout
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate to login anyway in case of error
      navigate('/login');
    }
  };  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="logo-link">
            <img src={logo} alt="Watchlist Logo" className="navbar-logo" />
          </Link>
        </div>

        <div className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </div>        <div className={`navbar-right ${isMenuOpen ? 'show' : ''}`}>
          <ul className="nav-links">
            <li>
              <Link to="/dashboard" className="nav-link" onClick={closeMenu}>
                <HomeIcon className="nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/Watchlist" className="nav-link" onClick={closeMenu}>
                <MovieIcon className="nav-icon" />
                <span>Watchlist</span>
              </Link>
            </li>
            <li>
              <Link to="/discover" className="nav-link" onClick={closeMenu}>
                <SearchIcon className="nav-icon" />
                <span>Discover</span>
              </Link>
            </li>            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/profile" className="nav-link" onClick={closeMenu}>
                    <PersonIcon className="nav-icon" />
                    <span>Profile</span>
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="logout-btn">
                    <LogoutIcon className="nav-icon" />
                    <span>Logout</span>
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" className="nav-link login-link" onClick={closeMenu}>
                  <span>Login</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
