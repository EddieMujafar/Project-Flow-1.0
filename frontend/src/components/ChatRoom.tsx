import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatRoom.css'; // Added CSS import

interface User {
  id: number;
  username: string;
}

interface Message {
  0: number; // userId
  1: string; // message
}

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]); // Ensure users is always an array
  const loggedInUserId = 1; // Replace with actual logged-in user ID

  useEffect(() => {
    // Fetch initial messages from the backend
    axios.get('/api/messages')
      .then((response) => {
        setMessages(response.data);
      })
      .catch((error) => {
        console.error('Error fetching messages:', error);
      });

    // Fetch users from the backend
    axios.get('/api/users')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setUsers(response.data); // Ensure the response is an array
        } else {
          console.error('Unexpected response format for users:', response.data);
          setUsers([]); // Fallback to an empty array
        }
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        setUsers([]); // Fallback to an empty array
      });
  }, []);

  const sendMessage = () => {
    if (!recipientId) {
      alert('Please select a recipient');
      return;
    }

    // Send message to the backend
    axios.post(`/api/messages/${loggedInUserId}`, { message, recipient_id: parseInt(recipientId) })
      .then(() => {
        setMessages([...messages, [loggedInUserId, message]]);
        setMessage('');
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
    }
  };

  const handleVoiceMessage = () => {
    // Handle voice message recording
    console.log('Voice message recording...');
  };

  const handleEmojiPicker = () => {
    // Handle emoji picker
    console.log('Emoji picker...');
  };

  return (
    <div className="chat-room">
      <h2><i className="fas fa-comments"></i> Chat Room</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-container ${
              msg[0] === loggedInUserId ? 'message-container-right' : 'message-container-left'
            }`}
          >
            <div className="user-icon">
              <i className="fas fa-user"></i>
            </div>
            <div
              className={`message-bubble ${
                msg[0] === loggedInUserId ? 'message-bubble-right' : 'message-bubble-left'
              }`}
            >
              {msg[1]}
            </div>
          </div>
        ))}
      </div>
      <div className="input-container">
        {/* Recipient selector */}
        <div className="recipient-selector">
          <label htmlFor="recipient">Recipient:</label>
          <select
            id="recipient"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            <option value="">Select a user</option>
            {users
              .filter((user) => user.id !== loggedInUserId)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
          </select>
        </div>
        {/* Add button for files/media */}
        <label className="input-action-button add-button">
          <i className="fas fa-plus"></i>
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-label="Add file or media"
          />
        </label>
        {/* Mic button for voice messages */}
        <button
          className="input-action-button mic-button"
          onClick={handleVoiceMessage}
          title="Record Voice Message"
          aria-label="Record Voice Message"
        >
          <i className="fas fa-microphone"></i>
        </button>
        {/* Sticker/Emoji button */}
        <button
          className="input-action-button emoji-button"
          onClick={handleEmojiPicker}
          title="Add Sticker or Emoji"
          aria-label="Add Sticker or Emoji"
        >
          <i className="fas fa-smile"></i>
        </button>
        {/* Text input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          aria-label="Message input"
        />
        {/* Send button */}
        <button onClick={sendMessage} title="Send Message" aria-label="Send">
          <i className="fas fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;