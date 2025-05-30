import React, { useState } from 'react';
import { Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './components/Register';
import ChatRoom from './components/ChatRoom';
import FindUsers from './components/FindUsers';
import Friends from './components/Friends'; // Ensure Friends component exists
import FriendsSuggestions from './components/FriendsSuggestions';
import PeopleYouMayKnow from './components/PeopleYouMayKnow';
import './App.css';

const App: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [otherUsersOpen, setOtherUsersOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUserId(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? 'light-mode' : 'dark-mode';
  };

  const location = useLocation();

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {(location.pathname === '/login' || location.pathname === '/') && <h1>Chat App</h1>}
      <nav>
        {userId ? (
          <div className="menu-container">
            <button
              className={`menu-button ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className={`menu-dropdown ${menuOpen ? 'show' : ''}`}>
              <Link to="/" title="Home">
                <i className="fas fa-home"></i> Home
              </Link>
              <Link to="/messages" title="Messages">
                <i className="fas fa-comments"></i> Messages
              </Link>
              <Link to="/find-users" title="Find Users">
                <i className="fas fa-search"></i> Find Users
              </Link>
              <div className="other-users-menu">
                <button
                  onClick={() => setOtherUsersOpen(!otherUsersOpen)}
                  aria-expanded={otherUsersOpen}
                >
                  <i className="fas fa-users"></i> Other Users
                  <i className={`fas fa-chevron-${otherUsersOpen ? 'up' : 'down'}`}></i>
                </button>
                <div className={`submenu ${otherUsersOpen ? 'show' : ''}`}>
                  <Link to="/friends" title="Friends">
                    <i className="fas fa-user-friends"></i> Friends
                  </Link>
                  <Link to="/friends-suggestions" title="Friends Suggestions">
                    <i className="fas fa-user-plus"></i> Friends Suggestions
                  </Link>
                  <Link to="/people-you-may-know" title="People You May Know">
                    <i className="fas fa-user-check"></i> People You May Know
                  </Link>
                </div>
              </div>
              <button onClick={toggleTheme} title="Toggle Theme" aria-label="Toggle Theme">
                <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>{' '}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={handleLogout} title="Logout" aria-label="Logout">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="menu">
            {location.pathname === '/login' && (
              <Link to="/register" title="Sign-Up" className="bottom-button">
                <i className="fas fa-user-plus"></i> Sign-Up
              </Link>
            )}
            {location.pathname === '/register' && (
              <Link to="/login" title="Login" className="bottom-button">
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
            )}
          </div>
        )}
      </nav>
      <Routes>
        <Route path="/" element={userId ? <Home userId={userId} /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login setUserId={setUserId} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/messages" element={userId ? <ChatRoom /> : <Navigate to="/login" />} />
        <Route path="/find-users" element={userId ? <FindUsers userId={userId} /> : <Navigate to="/login" />} />
        <Route path="/friends" element={userId ? <Friends userId={userId} /> : <Navigate to="/login" />} />
        <Route path="/friends-suggestions" element={userId ? <FriendsSuggestions userId={userId} /> : <Navigate to="/login" />} />
        <Route path="/people-you-may-know" element={userId ? <PeopleYouMayKnow userId={userId} /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;