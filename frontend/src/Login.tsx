import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Added CSS import

interface LoginProps {
  setUserId: (userId: number) => void;
}

const Login: React.FC<LoginProps> = ({ setUserId }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { username, password }); // Debug
    try {
      const response = await fetch('http://localhost:8000/api/authenticate', { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Ensure cookies are sent
      });
      const responseText = await response.text(); // Read once
      console.log('Fetch response:', response.status, responseText); // Debug
      if (response.ok) {
        const userId = JSON.parse(responseText);
        console.log('User ID:', userId); // Debug
        setUserId(userId);
        navigate('/');
      } else {
        console.error('Login failed:', responseText); // Debug
        setError(responseText || 'Failed to login');
      }
    } catch (err) {
      setError('Failed to login');
      console.error('Fetch error:', err); // Debug
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            aria-label="Username"
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            aria-label="Password"
          />
        </div>
        <button type="submit" title="Login" aria-label="Login">Login</button>
      </form>
    </div>
  );
};

export default Login;