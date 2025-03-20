import React, { useState, useEffect } from 'react';

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

interface HomeProps {
  userId: number;
}

const Home: React.FC<HomeProps> = ({ userId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch users for leaderboard
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Fetch users error:', err);
      }
    };

    // Fetch tasks
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/tasks', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else {
          setError('Failed to fetch tasks');
        }
      } catch (err) {
        setError('Failed to fetch tasks');
        console.error('Fetch tasks error:', err);
      }
    };

    fetchUsers();
    fetchTasks();
  }, []);

  return (
    <div className="home-container">
      <h1>Welcome to Chat Space</h1>
      <p>User ID: {userId}</p> {/* Display user ID */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Leaderboard */}
      <section className="leaderboard">
        <h2>Leaderboard</h2>
        <ul>
          {users
            .sort((a, b) => b.points - a.points) // Sort by points descending
            .map((user) => (
              <li key={user.id}>
                {user.username} - {user.points} points
              </li>
            ))}
        </ul>
      </section>

      {/* Tasks */}
      <section className="tasks">
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

      {/* New Tasks */}
      <section className="new-tasks">
        <h2>New Tasks</h2>
        <p>Stay tuned for upcoming tasks and activities!</p>
      </section>
    </div>
  );
};

export default Home;
