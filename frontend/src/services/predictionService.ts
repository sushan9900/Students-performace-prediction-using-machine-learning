
import api from './api';
import {
  StudentFeatures,
  SinglePredictionResponse,
} from '../types';

export interface SinglePredictionPayload {
  student_identifier?: string;
  features: StudentFeatures;
  model_id?: number;
}

export interface PredictionHistoryResponse {
  total_records: number;
  predictions: SinglePredictionResponse[];
}

export const predictionService = {
  /**
   * Executes real-time performance category prediction for a single student instance.
   */
  predictSingle: async (payload: SinglePredictionPayload): Promise<SinglePredictionResponse> => {
    const response = await api.post<SinglePredictionResponse>('/predict/single', payload);
    return response.data;
  },

  /**
   * Executes batch prediction for an array of student feature objects.
   */
  predictBatch: async (students: StudentFeatures[], modelId?: number) => {
    const response = await api.post('/predict/batch', {
      students,
      model_id: modelId,
    });
    return response.data;
  },

  /**
   * Fetches logged student prediction history.
   */
  getHistory: async (limit: number = 50): Promise<PredictionHistoryResponse> => {
    const response = await api.get<PredictionHistoryResponse>(`/predict/history?limit=${limit}`);
    return response.data;
  },
};

export default predictionService;
