import { publicApi, unwrap, DEMO_MODE } from '../api';
let flight;
export const storefrontPromotionService = {
  list() {
    if (DEMO_MODE) return Promise.resolve({ generatedAt: new Date().toISOString(), offers: [] });
    if (!flight) {
      const request = publicApi.get('/home/promotions').then(unwrap);
      flight = request;
      request.finally(() => { if (flight === request) flight = null; }).catch(() => {});
    }
    return flight;
  },
};
