import { createAuthenticatedHttpService } from '../../../utils/httpService';

const httpService = createAuthenticatedHttpService(import.meta.env.VITE_ANALYTICS_SERVICE_URL);

export default httpService;
