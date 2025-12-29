import { createAuthenticatedHttpService } from '../../../utils/httpService';

const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:4004';

const analyticsHttpService = createAuthenticatedHttpService(ANALYTICS_SERVICE_URL);

export { analyticsHttpService };