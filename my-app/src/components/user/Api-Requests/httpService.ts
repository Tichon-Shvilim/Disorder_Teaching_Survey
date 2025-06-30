import axios from 'axios';

export default axios.create({
   baseURL:import.meta.env.VITE_USER_SERVICE_URL,
});

