
import api from './api';
import { DashboardStats } from '../types';

export const dashboardService = {
  /**
   * Fetches summary metric cards, student averages, performance category distribution,
   * model accuracy comparison array, and attendance/study hour trend data.
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
