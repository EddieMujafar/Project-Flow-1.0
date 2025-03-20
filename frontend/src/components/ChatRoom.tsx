import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Message {
  0: number; // userId
  1: string; // message
}

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const loggedInUserId = 1; // Replace with actual logged-in user ID

  useEffect(() => {
    // Fetch initial messages from the backend
    axios.get('/api/messages').then((response) => {
      setMessages(response.data);
    }).catch((error) => {
      console.error('Error fetching messages:', error);
    });
  }, []);

  const sendMessage = () => {
    // Send message to the backend
    axios.post('/api/messages', { message }).then((response) => {
      setMessages([...messages, [loggedInUserId, response.data]]); // Assuming user_id 1 for simplicity
      setMessage('');
    }).catch((error) => {
      console.error('Error sending message:', error);
    });
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
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          aria-label="Message input"
        />
        <button onClick={sendMessage} title="Send Message" aria-label="Send">
          <i className="fas fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;