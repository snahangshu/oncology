import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial: This forces the browser to automatically attach HttpOnly cookies to every request!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle auto token refresh on 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized) and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/users/login') {
      originalRequest._retry = true;

      try {
        // Attempt to hit the refresh endpoint
        // The browser will automatically send the HttpOnly 'refresh_token' cookie!
        const refreshResponse = await axios.post(`${API_BASE}/users/refresh`, {}, { withCredentials: true });

        if (refreshResponse.status === 200) {
          // The backend successfully issued a new access_token HttpOnly cookie
          // We can just replay the original request, and the browser will attach the new cookie!
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g. refresh_token expired), log user out
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
