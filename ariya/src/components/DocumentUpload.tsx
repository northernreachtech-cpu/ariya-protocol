import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import { 
  uploadDocumentWithFallback, 
  validateDocument, 
  getFileTypeIcon, 
  formatFileSize,
  type DocumentUploadResult,
  type DocumentValidationResult,
  DOCUMENT_CONFIG
} from '../utils/documentUpload';

interface DocumentUploadProps {
  onUploadComplete: (result: DocumentUploadResult) => void;
  onUploadError: (error: string) => void;
  userAddress: string;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number;
  className?: string;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadResult?: DocumentUploadResult;
  validation?: DocumentValidationResult;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onUploadError,
  userAddress,
  maxFiles = 5,
  acceptedTypes = DOCUMENT_CONFIG.allowedTypes,
  maxFileSize = DOCUMENT_CONFIG.maxFileSize,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for files
  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = Array.from(selectedFiles).map(file => ({
      ...file,
      id: generateFileId(),
      uploadStatus: 'pending',
      validation: validateDocument(file)
    }));

    // Check if adding these files would exceed maxFiles
    if (files.length + newFiles.length > maxFiles) {
      onUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, onUploadError]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Upload file
  const uploadFile = async (file: FileWithPreview) => {
    if (!file.validation?.isValid) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'error' }
          : f
      ));
      return;
    }

    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
        : f
    ));



    try {
      const result = await uploadDocumentWithFallback(file, userAddress);
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'completed', uploadProgress: 100, uploadResult: result }
          : f
      ));

      onUploadComplete(result);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'error' }
          : f
      ));
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload all pending files
  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.uploadStatus === 'pending' && f.validation?.isValid);
    
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  // Get file status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20';
      case 'uploading':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const pendingFiles = files.filter(f => f.uploadStatus === 'pending' && f.validation?.isValid);
  const hasUploadingFiles = files.some(f => f.uploadStatus === 'uploading');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-card-secondary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Documents
            </h3>
            <p className="text-foreground-secondary text-sm mb-4">
              Drag and drop files here, or click to browse
            </p>
            
            <div className="text-xs text-foreground-muted space-y-1">
              <p>Supported formats: {DOCUMENT_CONFIG.allowedExtensions.join(', ')}</p>
              <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            {pendingFiles.length > 0 && !hasUploadingFiles && (
              <button
                onClick={uploadAllFiles}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Upload All ({pendingFiles.length})
              </button>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 bg-card-secondary rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl">
                      {getFileTypeIcon(file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.type}</span>
                        {file.validation && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.validation.isValid ? 'completed' : 'error')}`}>
                            {getStatusIcon(file.validation.isValid ? 'completed' : 'error')}
                            {file.validation.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upload Progress */}
                    {file.uploadStatus === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${file.uploadProgress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-secondary">
                          {file.uploadProgress || 0}%
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    {file.uploadStatus && file.uploadStatus !== 'pending' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.uploadStatus)}`}>
                        {getStatusIcon(file.uploadStatus)}
                        {file.uploadStatus === 'completed' ? 'Uploaded' : 
                         file.uploadStatus === 'error' ? 'Failed' : 
                         file.uploadStatus === 'uploading' ? 'Uploading' : 'Pending'}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {file.uploadStatus === 'completed' && file.uploadResult && (
                        <>
                          <button
                            onClick={() => window.open(file.uploadResult!.documentUrl, '_blank')}
                            className="p-1 text-foreground-secondary hover:text-foreground"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.uploadResult!.documentUrl;
                              link.download = file.name;
                              link.click();
                            }}
                            className="p-1 text-foreground-secondary hover:text-foreground"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {file.uploadStatus === 'pending' && file.validation?.isValid && (
                        <button
                          onClick={() => uploadFile(file)}
                          className="p-1 text-primary hover:text-primary/80"
                          title="Upload file"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Validation Errors */}
          {files.some(f => f.validation && !f.validation.isValid) && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Validation Errors
              </h5>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {files
                  .filter(f => f.validation && !f.validation.isValid)
                  .map(f => (
                    <li key={f.id}>
                      <strong>{f.name}:</strong> {f.validation!.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
