import axios from 'axios';

// Create the axios instance
const api = axios.create({
  // Use your actual backend URL here
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    // Make sure 'token' matches the key you use in localStorage during Login
    const token = localStorage.getItem('token'); 
    
    if (token) {
      // Must match the "Bearer " format expected by your middleware/Auth.js
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is invalid or expired, optionally clear storage and redirect
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;