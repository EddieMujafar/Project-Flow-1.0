import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatRoom.css'; // Added CSS import

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