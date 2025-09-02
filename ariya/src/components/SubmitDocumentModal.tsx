import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  X, 
  Send,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import DocumentUpload from './DocumentUpload';
import { type DocumentUploadResult } from '../utils/documentUpload';

interface SubmitDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documentData: {
    title: string;
    description: string;
    documentUri: string;
    documentType: string;
  }) => Promise<void>;
  isLoading?: boolean;
  eventName?: string;
  userAddress: string;
}

const SubmitDocumentModal: React.FC<SubmitDocumentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,

  eventName = "Event",
  userAddress
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentUri: '',
    documentType: ''
  });
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadComplete = (result: DocumentUploadResult) => {
    setUploadedDocument(result);
    setFormData(prev => ({
      ...prev,
      documentUri: result.documentUrl,
      documentType: result.mimeType
    }));
    setUploadError('');
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadedDocument(null);
  };

  const handleSubmit = async () => {
    if (!uploadedDocument) {
      setUploadError('Please upload a document first');
      return;
    }

    if (!formData.title.trim()) {
      setUploadError('Please enter a document title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        documentUri: uploadedDocument.documentUrl,
        documentType: uploadedDocument.mimeType
      });
      
      // Reset form on success
      setFormData({ title: '', description: '', documentUri: '', documentType: '' });
      setUploadedDocument(null);
      setUploadError('');
      onClose();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to submit document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', description: '', documentUri: '', documentType: '' });
      setUploadedDocument(null);
      setUploadError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Submit Document
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Upload and submit a document for approval
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Event Info */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Event: {eventName}
                </h3>
                <p className="text-xs text-foreground-secondary">
                  Document will be submitted to the approval workflow for this event
                </p>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </h3>
                <DocumentUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  userAddress={userAddress}
                  maxFiles={1}
                  className="border border-border rounded-lg p-4"
                />
              </div>

              {/* Document Details Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Details
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                    className="w-full p-3 bg-card-secondary border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the document and its purpose"
                    rows={3}
                    className="w-full p-3 bg-card-secondary border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Uploaded Document Info */}
                {uploadedDocument && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Document Uploaded Successfully
                      </span>
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <p><strong>File:</strong> {uploadedDocument.fileName}</p>
                      <p><strong>Size:</strong> {(uploadedDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Type:</strong> {uploadedDocument.mimeType}</p>
                      <p><strong>Provider:</strong> {uploadedDocument.provider}</p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {uploadError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        {uploadError}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Instructions */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Submission Process
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Document will be reviewed by the approval chain</li>
                  <li>• Each reviewer can approve, reject, or add comments</li>
                  <li>• Final approval releases funding to the event organizer</li>
                  <li>• You can track the approval progress in real-time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1" 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={isSubmitting || !uploadedDocument || !formData.title.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Document
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubmitDocumentModal;
