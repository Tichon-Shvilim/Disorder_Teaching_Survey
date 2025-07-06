import axios from 'axios';

export default axios.create({
   baseURL:import.meta.env.VITE_FORM_SERVICE_URL,
});

