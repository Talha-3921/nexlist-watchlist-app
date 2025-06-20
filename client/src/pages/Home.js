import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import logo from '../assets/images/NEXELIST LOGO.png';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [email, setEmail] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (email) {
      // Store email in local storage for pre-filling the signup form
      localStorage.setItem('signupEmail', email);
      // Navigate to signup page
      window.location.href = '/signup';
    }
  };

  return (
    <div className="home-container">
      {/* Netflix-style Header */}
      <header className="home-header">
        <div className="header-left">
          <img src={logo} alt="Nexelist Logo" className="header-logo" />
        </div>
        <div className="header-right">
          <Link to="/login" className="sign-in-btn">
            Sign In
          </Link>
        </div>      </header>

      <div className="home-content">
        {/* Main Heading */}
        <h1 className="main-heading">
          Track all you watch<br />
          in one place
        </h1>

        {/* Sub Text */}
        <p className="sub-text">
        From anime to games, Watchlist keeps track of your favorites.
        </p>        {/* Call to Action */}
        <div className="cta-section">
          <form className="email-signup" onSubmit={handleGetStarted}>
            <input
              type="email"
              className="email-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="get-started-btn">
              Get Started
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
