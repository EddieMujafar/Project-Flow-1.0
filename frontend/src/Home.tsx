import React, { useState, useEffect } from 'react';
import './Home.css'; // Added CSS import
import Confetti from 'react-confetti';

interface User {
  id: number;
  username: string;
  points: number; // Points for leaderboard
}

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  points: number;
  progress: number;
  goal: number;
}

interface Activity {
  id: number;
  description: string;
  timestamp: string;
}

interface HomeProps {
  userId: number;
}

const Home: React.FC<HomeProps> = ({ userId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 1, title: 'Send Messages', description: 'Send 5 messages to earn points', points: 50, progress: 2, goal: 5 },
    { id: 2, title: 'Complete a Task', description: 'Complete 1 task today', points: 30, progress: 0, goal: 1 },
  ]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    { id: 1, description: 'You sent a message to Alice', timestamp: '2 hours ago' },
    { id: 2, description: 'You completed a task: "Daily Login"', timestamp: '5 hours ago' },
  ]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRank, setUserRank] = useState<number>(0);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [quickMessageRecipient, setQuickMessageRecipient] = useState('');
  const [quickMessageContent, setQuickMessageContent] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const responseUsers = await fetch('/api/users', {
          credentials: 'include',
        });
        const responseActivity = await fetch(`/api/activity/${userId}`, {
          credentials: 'include',
        });

        if (responseUsers.ok && responseActivity.ok) {
          const dataUsers = await responseUsers.json();
          const dataActivity = await responseActivity.json();
          setUsers(dataUsers);
          setRecentActivity(dataActivity);

          // Calculate user's points and rank
          const currentUser = dataUsers.find((user: User) => user.id === userId);
          if (currentUser) {
            setUserPoints(currentUser.points);
          }
          const sortedUsers = [...dataUsers].sort((a: User, b: User) => b.points - a.points);
          const rank = sortedUsers.findIndex((user: User) => user.id === userId) + 1;
          setUserRank(rank);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleChallengeComplete = async (challengeId: number, currentProgress: number, goal: number) => {
    setChallenges((prevChallenges) =>
      prevChallenges.map((challenge) => {
        if (challenge.id === challengeId && challenge.progress < challenge.goal) {
          const newProgress = challenge.progress + 1;
          if (newProgress === challenge.goal) {
            setUserPoints((prevPoints) => prevPoints + challenge.points);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            alert(`Challenge completed! You earned ${challenge.points} points.`);
          }
          return { ...challenge, progress: newProgress };
        }
        return challenge;
      })
    );
  };

  const handleQuickMessage = () => {
    setShowQuickMessage(true);
  };

  const handleQuickMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const recipient = users.find((user) => user.username === quickMessageRecipient);
        if (!recipient) {
            setError('Recipient not found');
            return;
        }

        const response = await fetch(`http://localhost:8000/api/messages/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: quickMessageContent, recipient_id: recipient.id }),
            credentials: 'include',
        });

        if (response.ok) {
            // Refresh recent activity
            const activityResponse = await fetch(`http://localhost:8000/api/activity/${userId}`, {
                credentials: 'include',
            });
            if (activityResponse.ok) {
                const activityData = await activityResponse.json();
                setRecentActivity(activityData);
            }

            setQuickMessageRecipient('');
            setQuickMessageContent('');
            setShowQuickMessage(false);
        } else {
            setError('Failed to send quick message');
        }
    } catch (err) {
        setError('Failed to send quick message');
        console.error('Quick message error:', err);
    }
};

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      {showConfetti && <Confetti />}
      {error && <p className="error">{error}</p>}

      {/* User Points and Rank Card */}
      <section className="user-stats fade-in">
        <h2>Welcome, User {userId}!</h2>
        <div className="stats-card">
          <div className="stat-item">
            <i className="fas fa-star"></i>
            <p>Your Points: <span>{userPoints}</span></p>
          </div>
          <div className="stat-item">
            <i className="fas fa-trophy"></i>
            <p>Your Rank: <span>#{userRank}</span></p>
          </div>
          <button className="quick-message-btn" onClick={handleQuickMessage}>
            <i className="fas fa-comments"></i> Send a Quick Message
          </button>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="leaderboard fade-in">
        <h2>Leaderboard</h2>
        <ul>
          {users
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((user, index) => (
              <li key={user.id} className={user.id === userId ? 'current-user' : ''}>
                <span className="rank">#{index + 1}</span>
                <span className="username">{user.username}</span>
                <span className="points">{user.points} points</span>
              </li>
            ))}
          {userRank > 5 && (
            <li className="current-user">
              <span className="rank">#{userRank}</span>
              <span className="username">You</span>
              <span className="points">{userPoints} points</span>
            </li>
          )}
        </ul>
      </section>

      {/* Daily Challenges */}
      <section className="challenges fade-in">
        <h2>Daily Challenges</h2>
        <ul>
          {challenges.map((challenge) => (
            <li key={challenge.id} className={challenge.progress === challenge.goal ? 'completed' : ''}>
              <div className="challenge-info">
                <h3>{challenge.title}</h3>
                <p>{challenge.description}</p>
                <p>Points: {challenge.points}</p>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                  ></div>
                </div>
                <p>
                  Progress: {challenge.progress}/{challenge.goal}
                </p>
              </div>
              {challenge.progress < challenge.goal && (
                <button
                  className="complete-btn"
                  onClick={() => handleChallengeComplete(challenge.id, challenge.progress, challenge.goal)}
                >
                  Mark Progress
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Tasks */}
      <section className="tasks fade-in">
        <h2>Tasks</h2>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Status: {task.completed ? 'Completed' : 'Pending'}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Activity */}
      <section className="recent-activity fade-in">
        <h2>Recent Activity</h2>
        <ul>
          {recentActivity.map((activity) => (
            <li key={activity.id}>
              <p>{activity.description}</p>
              <span className="timestamp">{activity.timestamp}</span>
            </li>
          ))}
        </ul>
      </section>

      {showQuickMessage && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Send a Quick Message</h3>
            <form onSubmit={handleQuickMessageSubmit}>
              <div className="form-group">
                <label htmlFor="recipient">Recipient:</label>
                <select
                  id="recipient"
                  value={quickMessageRecipient}
                  onChange={(e) => setQuickMessageRecipient(e.target.value)}
                  required
                >
                  <option value="">Select a user</option>
                  {users
                    .filter((user) => user.id !== userId)
                    .map((user) => (
                      <option key={user.id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message-content">Message:</label>
                <textarea
                  id="message-content"
                  value={quickMessageContent}
                  onChange={(e) => setQuickMessageContent(e.target.value)}
                  placeholder="Type your message..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit">Send</button>
                <button type="button" onClick={() => setShowQuickMessage(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
