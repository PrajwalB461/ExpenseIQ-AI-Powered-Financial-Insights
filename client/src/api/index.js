import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Response interceptor to handle errors/tokens globally if needed
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, could clear context/cookie on the client if necessary
    return Promise.reject(error);
  }
);

export default API;
