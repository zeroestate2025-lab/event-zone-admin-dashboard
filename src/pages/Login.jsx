import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/authService';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import '../styles/Login.css';

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await loginAdmin(username, password);

      if (token) {
        setIsLoggedIn(true);
        localStorage.setItem('adminLoginPhoneNumber', username);
        navigate('/');
      } else {
        setError('Login succeeded but no token was received.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div className="background-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      {/* Main Login Section */}
      <div className="login-wrapper">
        {/* Left Side - Branding & Features */}
        <div className="login-left">
          <div className="brand-section">
            <div className="logo-circle">
              <h1 className="brand-title">Evnzon</h1>
            </div>
            <p className="brand-subtitle">Admin Dashboard</p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>Professional Management</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>Secure Access Control</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>Real-Time Analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>Advanced Reporting</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-box">
            <div className="login-header">
              <h2 className="login-title">Welcome Back</h2>
              <p className="login-subtitle">Sign in to your admin account</p>
            </div>

            {error && (
              <div className="error-message-box">
                <span className="error-icon">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form className="login-form" onSubmit={handleLogin}>
              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="username" className={username ? 'active' : ''}>
                  USERNAME / PHONE
                </label>
                <div className="input-wrapper">
                  <label className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder=" "
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className={password ? 'active' : ''}>
                  PASSWORD / OTP
                </label>
                <div className="input-wrapper">
                  <label className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder=" "
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                {/* <a href="#" className="forgot-password">Forgot Password?</a> */}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner-icon" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login to Dashboard</span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="login-footer">
              <p className="footer-text">
                © 2025 Evnzon. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
