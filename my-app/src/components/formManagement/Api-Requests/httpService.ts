import { createAuthenticatedHttpService } from '../../../utils/httpService';

const httpService = createAuthenticatedHttpService(import.meta.env.VITE_FORM_SERVICE_URL);

export default httpService;

