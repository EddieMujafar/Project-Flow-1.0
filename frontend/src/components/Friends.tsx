import React, { useState, useEffect } from 'react';
import './Friends.css';

interface User {
  id: number;
  username: string;
}

interface FriendsProps {
  userId: number;
}

const Friends: React.FC<FriendsProps> = ({ userId }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`/api/friends/${userId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setFriends(data);
        } else {
          const errorText = await response.text();
          setError(errorText || 'Failed to fetch friends');
        }
      } catch (err) {
        setError('Failed to fetch friends');
        console.error('Fetch friends error:', err);
      }
    };

    fetchFriends();
  }, [userId]);

  return (
    <div className="friends-container">
      <h2>Your Friends</h2>
      {error && <p className="error">{error}</p>}
      {friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend.id}>
              <span className="username">{friend.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Friends;
