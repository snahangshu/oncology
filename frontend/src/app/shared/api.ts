import axios from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/authSlice';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization header
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auto token refresh on 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = store.getState().auth.refreshToken;

      if (refreshToken) {
        try {
          // Perform the token refresh using standard axios directly to bypass the interceptor loop
          const refreshResponse = await axios.post(`${API_BASE}/users/refresh`, {
            refresh_token: refreshToken,
          });

          if (refreshResponse.status === 200) {
            const data = refreshResponse.data;
            // Update the state and cookies with new tokens
            store.dispatch(setTokens({ token: data.access_token, refreshToken: data.refresh_token }));

            // Update auth header for original request and replay it
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, log user out
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      }
      
      // If no refresh token, log user out
      store.dispatch(logout());
    }
    
    return Promise.reject(error);
  }
);
