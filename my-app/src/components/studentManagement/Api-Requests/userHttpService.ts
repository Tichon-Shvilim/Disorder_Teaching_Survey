import axios from 'axios';

const userHttpService = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
});

// Add a request interceptor to include the token
userHttpService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface User {
  id: string;  // Changed from _id to id
  name: string;
  email: string;
  role: string;
  status: string;
  students?: Array<{
    _id: string;
    name: string;
  }>;
}

// Get all users
export const getAllUsers = () => {
  return userHttpService.get<User[]>('/api/users');
};

// Get therapists only
export const getAllTherapists = () => {
  return userHttpService.get<User[]>('/api/users').then(response => {
    return {
      ...response,
      data: response.data.filter(user => 
        user.role.toLowerCase() === 'therapist' && user.status === 'active'
      )
    };
  });
};

// Get user by ID
export const getUserById = (id: string) => {
  return userHttpService.get<User>(`/api/users/${id}`);
};

export default userHttpService;