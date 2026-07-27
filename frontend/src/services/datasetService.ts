
import api from './api';
import {
  DatasetMetadata,
  DatasetPreview,
  DatasetValidation
} from '../types';

export const datasetService = {
  /**
   * Uploads a CSV dataset file to the backend API.
   */
  uploadDataset: async (file: File): Promise<DatasetMetadata> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<DatasetMetadata>('/dataset/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Fetches dataset preview statistics (sample rows, missing values, duplicates).
   */
  getDatasetPreview: async (datasetId: number): Promise<DatasetPreview> => {
    const response = await api.get<DatasetPreview>(`/dataset/preview/${datasetId}`);
    return response.data;
  },

  /**
   * Fetches dataset schema validation diagnostics.
   */
  validateDataset: async (datasetId: number): Promise<DatasetValidation> => {
    const response = await api.get<DatasetValidation>(`/dataset/validate/${datasetId}`);
    return response.data;
  },

  /**
   * Triggers dataset missing value auto-cleaning and deduplication.
   */
  cleanDataset: async (
    datasetId: number,
    missingStrategy: string = 'mean',
    removeDuplicates: boolean = true
  ) => {
    const response = await api.post(`/dataset/clean/${datasetId}`, {
      missing_value_strategy: missingStrategy,
      remove_duplicates: removeDuplicates,
      scale_features: true,
    });
    return response.data;
  },

  /**
   * Fetches currently active dataset metadata.
   */
  getActiveDataset: async (): Promise<DatasetMetadata> => {
    const response = await api.get<DatasetMetadata>('/dataset/active');
    return response.data;
  },
};

export default datasetService;
