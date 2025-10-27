import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/authService';
import '../styles/Login.css';

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await loginAdmin(username, password);

      if (token) {
        setIsLoggedIn(true);
        localStorage.setItem('adminLoginPhoneNumber', username); // Store login phone number
        navigate('/'); // Redirect to dashboard
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
      {/* Animated Login Box */}
      <div className="login-box">
        <h1 className="login-title">Evnzon</h1>
        <h2>Admin Login</h2>

        {error && <p className="error-message">{error}</p>}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleLogin}>
          {/* Username Field */}
          <div className="form-group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="username">Username / Phone</label>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="password">Password / OTP</label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
