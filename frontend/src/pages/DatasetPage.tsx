import React, { useEffect, useState } from 'react';
import {
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Table as TableIcon,
  RefreshCw,
  Info,
} from 'lucide-react';

import { FileUploadModal } from '../components/FileUploadModal';
import { datasetService } from '../services/datasetService';
import { DatasetMetadata, DatasetPreview, DatasetValidation } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';

export const DatasetPage: React.FC = () => {
  const [activeDataset, setActiveDataset] = useState<DatasetMetadata | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [validation, setValidation] = useState<DatasetValidation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasetDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const active = await datasetService.getActiveDataset();
      setActiveDataset(active);

      if (active.id) {
        const previewData = await datasetService.getDatasetPreview(active.id);
        setPreview(previewData);

        const valData = await datasetService.validateDataset(active.id);
        setValidation(valData);
      }
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'No active dataset found. Please upload a dataset.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetDetails();
  }, []);

  const handleAutoClean = async (strategy: string) => {
    if (!activeDataset?.id) return;
    setIsCleaning(true);
    setCleanMessage(null);
    try {
      const result = await datasetService.cleanDataset(activeDataset.id, strategy, true);
      setCleanMessage(`Cleaned dataset: ${result.rows_removed} duplicate rows removed. ${result.cleaned_row_count} total clean records remaining.`);
      setIsCleaning(false);
      fetchDatasetDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to auto-clean dataset.');
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-6 border-indigo-500/20">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Dataset Management & Preprocessing
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              CSV Ingestion
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload student academic datasets, inspect sample records, validate column schemas, and execute automated missing value cleaning.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={fetchDatasetDetails} className="btn-secondary text-xs flex items-center space-x-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs flex items-center space-x-2">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New CSV</span>
          </button>
        </div>
      </div>

      {/* Clean Success Notification */}
      {cleanMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{cleanMessage}</span>
        </div>
      )}

      {/* Dataset Summary Cards */}
      {activeDataset && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-4 border-slate-800">
            <div className="text-xs text-slate-400">Active File</div>
            <div className="text-base font-bold text-white mt-1 truncate">{activeDataset.filename}</div>
            <div className="text-[11px] text-slate-500 mt-1">{formatBytes(activeDataset.file_size_bytes)}</div>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <div className="text-xs text-slate-400">Total Student Rows</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{activeDataset.row_count}</div>
            <div className="text-[11px] text-slate-500 mt-1">Student Data Instances</div>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <div className="text-xs text-slate-400">Feature Columns</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{activeDataset.column_count}</div>
            <div className="text-[11px] text-slate-500 mt-1">Academic Attributes</div>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <div className="text-xs text-slate-400">Upload Date</div>
            <div className="text-sm font-semibold text-slate-200 mt-1">{formatDate(activeDataset.uploaded_at)}</div>
            <div className="text-[11px] text-emerald-400 mt-1">✓ Active for ML Training</div>
          </div>
        </div>
      )}

      {/* Schema Validation Diagnostics Box */}
      {validation && (
        <div
          className={`glass-card p-5 border ${
            validation.is_valid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            {validation.is_valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">
                {validation.is_valid ? 'Dataset Schema Fully Validated' : 'Dataset Schema Warning'}
              </h3>
              <p className="text-xs text-slate-400">
                Diagnostic status for machine learning model preprocessor compatibility
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pl-8">
            {validation.validation_messages.map((msg, idx) => (
              <div key={`val-${idx}`} className="text-xs text-slate-300 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>{msg}</span>
              </div>
            ))}
          </div>

          {/* Auto-Cleaning Action Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Missing Cells: {validation.missing_value_total} • Duplicate Rows: {validation.duplicate_rows}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAutoClean('mean')}
                disabled={isCleaning}
                className="btn-secondary text-xs flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Impute (Mean)</span>
              </button>
              <button
                onClick={() => handleAutoClean('drop')}
                disabled={isCleaning}
                className="btn-secondary text-xs text-red-400 hover:text-red-300"
              >
                Drop Invalid Rows
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Sample Table Preview */}
      {preview && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <TableIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Dataset Records Preview (First 10 Rows)</h3>
            </div>
            <span className="text-xs text-slate-400">Total Columns: {preview.columns.length}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  {preview.columns.map((col, idx) => (
                    <th key={`th-${idx}`} className="px-4 py-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {preview.sample_rows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-slate-900/60 transition-colors">
                    {preview.columns.map((col, cIdx) => (
                      <td key={`td-${rIdx}-${cIdx}`} className="px-4 py-2.5 whitespace-nowrap text-slate-300">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload File Modal Component */}
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={() => fetchDatasetDetails()}
      />
    </div>
  );
};

export default DatasetPage;
