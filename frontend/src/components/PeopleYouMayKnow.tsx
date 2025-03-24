import React, { useState, useEffect } from 'react';
import './PeopleYouMayKnow.css';

interface User {
  id: number;
  username: string;
  points: number;
}

interface PeopleYouMayKnowProps {
  userId: number;
}

const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = ({ userId }) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/people-you-may-know/${userId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        } else {
          const errorText = await response.text();
          setError(errorText || 'Failed to fetch suggestions');
        }
      } catch (err) {
        setError('Failed to fetch suggestions');
        console.error('Fetch suggestions error:', err);
      }
    };

    fetchSuggestions();
  }, [userId]);

  const handleAddFriend = async (friendId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friends/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
        credentials: 'include',
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((user) => user.id !== friendId));
      } else {
        setError('Failed to add friend');
      }
    } catch (err) {
      setError('Failed to add friend');
      console.error('Add friend error:', err);
    }
  };

  return (
    <div className="people-you-may-know-container">
      <h2>People You May Know</h2>
      {error && <p className="error">{error}</p>}
      {suggestions.length === 0 ? (
        <p>No suggestions available.</p>
      ) : (
        <ul>
          {suggestions.map((user) => (
            <li key={user.id}>
              <span className="username">{user.username}</span>
              <span className="points">{user.points} points</span>
              <button onClick={() => handleAddFriend(user.id)} className="add-friend-btn">
                Add Friend
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PeopleYouMayKnow;
