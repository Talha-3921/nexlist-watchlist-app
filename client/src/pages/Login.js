import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/NEXELIST LOGO.png';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const result = await login(formData);
        
        if (result.success) {
          toast.success(result.message);
          // Redirect to dashboard or home page
          navigate('/dashboard');
        } else {
          toast.error(result.message);
          setErrors({ general: result.message });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
        setErrors({ general: 'Login failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Header with Logo */}
      <header className="login-header">
        <div className="header-left">
          <Link to="/">
            <img src={logo} alt="Nexelist Logo" className="header-logo" />
          </Link>
        </div>      </header>

      <div className="login-content">
        <div className="login-form-container">
          <h1 className="login-heading">Sign In</h1>
          <p className="login-subtext">Welcome back to your personalized tracking experience</p>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'form-input error' : 'form-input'}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'form-input error' : 'form-input'}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}            </div>
            
            {errors.general && <div className="error-message general-error">{errors.general}</div>}
            
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="login-footer">
            <p className="forgot-password">
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </p>
            <p className="signup-prompt">
              New to Nexelist? <Link to="/signup" className="signup-link">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
