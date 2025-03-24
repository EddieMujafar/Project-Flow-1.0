import React, { useState, useEffect } from 'react';
import './FriendsSuggestions.css';

interface User {
    id: number;
    username: string;
    points: number;
}

interface FriendsSuggestionsProps {
    userId: number;
}

const FriendsSuggestions: React.FC<FriendsSuggestionsProps> = ({ userId }) => {
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch(`/api/friends-suggestions/${userId}`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                } else {
                    setError('Failed to fetch suggestions');
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
            const response = await fetch(`/api/friends/${userId}`, {
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
        <div className="friends-suggestions-container">
            <h2>Friends Suggestions</h2>
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

export default FriendsSuggestions;
