import axios from 'axios';

// Auto-detect backend URL based on environment
const getBackendUrl = () => {
  // If explicitly set via environment variable, use that
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  
  // Production frontend should use production backend
  if (hostname === 'mirvaa-fashions.vercel.app' || hostname.includes('vercel.app')) {
    return 'https://mirvaa-backend.onrender.com';
  }
  
  // Development or localhost
  return 'http://localhost:8000';
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

console.log('Using backend URL:', BACKEND_URL);

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API,
  timeout: 5000, // Add timeout to prevent long loading times
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network error or server not responding');
    }
    return Promise.reject(error);
  }
);

// Add admin token to admin requests
const adminClient = axios.create({
  baseURL: API,
  timeout: 5000, // Add timeout to prevent long loading times
});

adminClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// Add response interceptor to handle errors globally for admin client
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network error or server not responding');
    }
    return Promise.reject(error);
  }
);

export { API, apiClient, adminClient };
