import { refreshAccessToken } from './token.js'; 

export const apiRequest = async (endpoint, method, body) => {
  try {
    const expiry = parseInt(localStorage.getItem('tokenExpiry'), 10);
    if (expiry && Date.now() >= expiry - 60000) {
      // 1 min before expiry
      await refreshAccessToken();
    }

    const currentToken = localStorage.getItem('token');

    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`, 
      },
      body: JSON.stringify(body),
      credentials: 'include', 
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error; 
  }
};


export const login = async (email, password) => {
  return apiRequest('/api/auth/login', 'POST', { email, password });
};

export const signup = async (username, email, password) => {
  return apiRequest('/api/auth/signup', 'POST', { username, email, password });
};
