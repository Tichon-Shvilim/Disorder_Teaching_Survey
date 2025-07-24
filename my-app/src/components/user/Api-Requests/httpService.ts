import { createAuthenticatedHttpService } from '../../../utils/httpService';

const httpService = createAuthenticatedHttpService(import.meta.env.VITE_USER_SERVICE_URL);

export default httpService;