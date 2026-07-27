
import api from './api';
import {
  ModelDetail,
  ModelComparison
} from '../types';

export interface TrainModelParams {
  dataset_id?: number;
  target_column?: string;
  test_size?: number;
  random_state?: number;
  cv_folds?: number;
  selected_algorithms?: string[];
}

export const mlService = {
  /**
   * Triggers machine learning training and automated comparison across selected algorithms.
   */
  trainModels: async (params: TrainModelParams = {}): Promise<ModelComparison> => {
    const response = await api.post<ModelComparison>('/ml/train', {
      target_column: params.target_column || 'PerformanceCategory',
      test_size: params.test_size || 0.2,
      random_state: params.random_state || 42,
      cv_folds: params.cv_folds || 5,
      selected_algorithms: params.selected_algorithms || [
        'random_forest',
        'decision_tree',
        'logistic_regression',
        'svm',
        'knn',
        'naive_bayes',
      ],
      dataset_id: params.dataset_id,
    });
    return response.data;
  },

  /**
   * Fetches all trained machine learning model records.
   */
  getAllModels: async (): Promise<ModelDetail[]> => {
    const response = await api.get<ModelDetail[]>('/ml/models');
    return response.data;
  },

  /**
   * Fetches metrics for the single auto-selected winning model.
   */
  getBestModel: async (): Promise<ModelDetail> => {
    const response = await api.get<ModelDetail>('/ml/best-model');
    return response.data;
  },
};

export default mlService;
