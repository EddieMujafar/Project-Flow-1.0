import React, { useState, useEffect } from 'react';
import './FindUsers.css';

interface User {
  id: number;
  username: string;
  points: number;
}

interface FindUsersProps {
  userId: number;
}

const FindUsers: React.FC<FindUsersProps> = ({ userId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsResponse = await fetch(`/api/friends/${userId}`, {
          credentials: 'include',
        });
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData);
        } else {
          const errorText = await friendsResponse.text();
          setError(errorText || 'Failed to fetch friends');
        }
      } catch (err) {
        setError('Failed to fetch friends');
        console.error('Fetch error:', err);
      }
    };

    fetchFriends();
  }, [userId]);

  const handleSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a username to search');
      return;
    }

    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
        setError('');
      } else {
        const errorText = await response.text();
        setError(errorText || 'User not found');
        setUsers([]);
      }
    } catch (err) {
      setError('Failed to search for user');
      console.error('Search error:', err);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friends/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
        credentials: 'include',
      });

      if (response.ok) {
        const newFriend = users.find((user) => user.id === friendId);
        if (newFriend) {
          setFriends((prev) => [...prev, newFriend]);
          setUsers((prev) => prev.filter((user) => user.id !== friendId));
        }
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to add friend');
      }
    } catch (err) {
      setError('Failed to add friend');
      console.error('Add friend error:', err);
    }
  };

  return (
    <div className="find-users-container">
      <h2>Find Users</h2>
      {error && <p className="error">{error}</p>}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search Users"
        />
        <button onClick={handleSearch} className="search-btn">
          Search
        </button>
      </div>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <span className="username">{user.username}</span>
              <span className="points">{user.points} points</span>
              {friends.some((friend) => friend.id === user.id) ? (
                <span className="already-friends">Already Friends</span>
              ) : (
                <button onClick={() => handleAddFriend(user.id)} className="add-friend-btn">
                  Add Friend
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <h3>Your Friends</h3>
      {friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend.id}>
              <span className="username">{friend.username}</span>
              <span className="points">{friend.points} points</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FindUsers;
