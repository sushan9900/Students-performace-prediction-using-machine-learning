import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { datasetService } from '../services/datasetService';
import { DatasetMetadata } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (metadata: DatasetMetadata) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Invalid file format. Please upload a .csv dataset file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum permitted limit of 10MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const metadata = await datasetService.uploadDataset(file);
      setIsUploading(false);
      onUploadSuccess(metadata);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Failed to upload dataset file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-800 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Upload Student Dataset</h3>
              <p className="text-xs text-slate-400">Select a CSV file containing student academic features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-medium text-slate-200 text-sm">{file.name}</div>
              <div className="text-xs text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Upload
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-medium text-indigo-400">Click to browse</span>
                <span className="text-sm text-slate-400"> or drag & drop CSV dataset</span>
              </div>
              <p className="text-xs text-slate-500">Supports .csv files up to 10MB</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={!file || isUploading}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Upload...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Dataset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
