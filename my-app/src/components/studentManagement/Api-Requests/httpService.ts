import axios from 'axios';


const httpService = axios.create({
  baseURL: import.meta.env.VITE_STUDENT_SERVICE_URL,
});

// Add a request interceptor to include the token
httpService.interceptors.request.use(
 
  (config) => {
    // Get token from localStorage (or Redux if you prefer)
    const token = localStorage.getItem('token');
     
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default httpService;