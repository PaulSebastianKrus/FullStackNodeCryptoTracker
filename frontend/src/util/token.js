import { token, tokenExpiry } from '../stores/generalStore.js';

export const refreshAccessToken = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    // parse data
    const data = await response.json();
    // update token in generalStore
    token.set(data.token);
    tokenExpiry.set((Date.now() + 15 * 60 * 1000).toString());
  } catch (err) {
    console.error('Error refreshing access token:', err);
    token.set(null);
    tokenExpiry.set(null);
    throw err;
  }
};
