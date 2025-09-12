import axios from 'axios';
import { ChatRequest, ChatResponse } from '@/types/api';

const API_BASE_URL = 'http://localhost:8000';

export const sendChatQuery = async (query: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_BASE_URL}/chat`,
      { query } as ChatRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to connect to the backend. Please ensure the server is running on localhost:8000'
      );
    }
    throw error;
  }
};