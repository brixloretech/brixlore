import { api } from './api';
import type { AdConfigDto } from '../types/adConfig';

class AdConfigService {
  async getPublicAdConfig(): Promise<AdConfigDto> {
    const res = await api.get<AdConfigDto>('/ad-config');
    return res.data;
  }
}

export const adConfigService = new AdConfigService();
