import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Adjust the URL as needed

export const registerUser = async (username: string) => {
    try {
        const response = await axios.post(`${API_URL}/api/register`, { username });
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const sendMessage = async (userId: number, message: string) => {
    try {
        const response = await axios.post(`${API_URL}/api/messages`, { userId, message });
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const fetchMessages = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/messages`);
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

export const fetchUserPoints = async (userId: number) => {
    try {
        const response = await axios.get(`${API_URL}/api/users/${userId}/points`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user points:', error);
        throw error;
    }
};