import React, { useState } from 'react';
import './AddUserByUsername.css';

interface AddUserByUsernameProps {
  userId: number;
}

const AddUserByUsername: React.FC<AddUserByUsernameProps> = ({ userId }) => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/friends/add-by-username/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      if (response.ok) {
        setMessage(`Successfully added ${username} as a friend.`);
        setError('');
        setUsername('');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to add user');
        setMessage('');
      }
    } catch (err) {
      setError('Failed to add user');
      setMessage('');
      console.error('Add user error:', err);
    }
  };

  return (
    <div className="add-user-by-username-container">
      <h2>Add User by Username</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleAddUser}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </div>
        <button type="submit" className="add-user-btn">Add User</button>
      </form>
    </div>
  );
};

export default AddUserByUsername;
