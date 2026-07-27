
export type PerformanceCategory = 'Excellent' | 'Good' | 'Average' | 'Poor';

export interface StudentFeatures {
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  attendance: number;
  study_hours: number;
  previous_semester_marks: number;
  assignment_score: number;
  internal_assessment: number;
  class_participation: number;
  internet_access: 'Yes' | 'No';
  parental_education: 'High School' | 'Associate' | 'Bachelor' | 'Master' | 'Doctorate';
  family_income: 'Low' | 'Medium' | 'High';
  extra_curricular_activities: 'Yes' | 'No';
}

export interface DatasetMetadata {
  id: number;
  filename: string;
  file_path: string;
  row_count: number;
  column_count: number;
  columns_list: string[];
  file_size_bytes: number;
  uploaded_at: string;
  is_active: boolean;
}

export interface DatasetPreview {
  filename: string;
  row_count: number;
  column_count: number;
  columns: string[];
  sample_rows: Record<string, any>[];
  missing_values: Record<string, number>;
  duplicate_count: number;
  data_types: Record<string, string>;
  numerical_summary?: Record<string, Record<string, number>>;
}

export interface DatasetValidation {
  is_valid: boolean;
  filename: string;
  total_rows: number;
  total_columns: number;
  missing_value_total: number;
  duplicate_rows: number;
  validation_messages: string[];
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
}

export interface ModelDetail {
  id: number;
  model_name: string;
  model_type: string;
  is_best_model: boolean;
  file_path: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_score_mean: number;
  cv_score_std: number;
  confusion_matrix?: ConfusionMatrixData;
  classification_report?: Record<string, any>;
  feature_importance?: Record<string, number>;
  hyperparameters?: Record<string, any>;
  trained_at: string;
}

export interface ModelComparison {
  total_models_trained: number;
  best_model_name: string;
  best_model_type: string;
  best_accuracy: number;
  models: ModelDetail[];
}

export interface SinglePredictionResponse {
  id?: number;
  student_identifier: string;
  input_features: Record<string, any>;
  predicted_category: PerformanceCategory;
  confidence_probabilities: Record<string, number>;
  model_used: string;
  created_at: string;
}

export interface DashboardStats {
  summary_cards: {
    total_datasets: number;
    total_models_trained: number;
    total_predictions_made: number;
    best_performing_model: string;
    best_model_accuracy: number;
  };
  student_statistics: {
    avg_attendance: number;
    avg_study_hours: number;
    avg_previous_marks: number;
    total_students: number;
  };
  performance_distribution: { category: string; count: number }[];
  model_comparison: { model_name: string; accuracy: number; f1_score: number; is_best: boolean }[];
  attendance_analysis: { id: number; attendance: number; marks: number; category: string }[];
  study_hours_analysis: { id: number; study_hours: number; marks: number; category: string }[];
}
