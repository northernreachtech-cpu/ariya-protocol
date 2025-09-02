import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { 
  type DocumentSubmission, 
  DOCUMENT_STATES 
} from '../lib/sdk/documentFlow';

interface DocumentSubmissionCardProps {
  submission: DocumentSubmission;
  onViewDetails?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onFund?: () => void;
  canReview?: boolean;
  canFund?: boolean;
  isLoading?: boolean;
}

const DocumentSubmissionCard: React.FC<DocumentSubmissionCardProps> = ({
  submission,
  onViewDetails,
  onApprove,
  onReject,
  onFund,
  canReview = false,
  canFund = false,
  isLoading = false
}) => {
  const getStatusIcon = (state: number) => {
    switch (state) {
      case DOCUMENT_STATES.IN_REVIEW:
        return <Clock className="h-4 w-4" />;
      case DOCUMENT_STATES.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case DOCUMENT_STATES.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case DOCUMENT_STATES.FUNDED:
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (state: number) => {
    switch (state) {
      case DOCUMENT_STATES.IN_REVIEW:
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20";
      case DOCUMENT_STATES.APPROVED:
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case DOCUMENT_STATES.REJECTED:
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20";
      case DOCUMENT_STATES.FUNDED:
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-400/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20";
    }
  };

  const getStatusText = (state: number) => {
    switch (state) {
      case DOCUMENT_STATES.IN_REVIEW:
        return "In Review";
      case DOCUMENT_STATES.APPROVED:
        return "Approved";
      case DOCUMENT_STATES.REJECTED:
        return "Rejected";
      case DOCUMENT_STATES.FUNDED:
        return "Funded";
      default:
        return "Unknown";
    }
  };

  const getActionText = (action: number) => {
    switch (action) {
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getActionColor = (action: number) => {
    switch (action) {
      case 0:
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20";
      case 1:
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case 2:
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-skeleton rounded w-48"></div>
          <div className="h-5 bg-skeleton rounded w-20"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-skeleton rounded w-full"></div>
          <div className="h-4 bg-skeleton rounded w-3/4"></div>
          <div className="h-4 bg-skeleton rounded w-1/2"></div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-skeleton rounded flex-1"></div>
          <div className="h-8 bg-skeleton rounded flex-1"></div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              {getStatusIcon(submission.state)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {submission.title}
              </h3>
              <p className="text-sm text-foreground-secondary">
                {submission.document_type.toUpperCase()} • Level {submission.current_reviewer_level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.state)}`}>
              {getStatusText(submission.state)}
            </span>
          </div>
        </div>

        {/* Document Info */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Document Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Type:</span>
                  <span className="text-foreground font-medium">{submission.document_type.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Submitted:</span>
                  <span className="text-foreground">{new Date(submission.submitted_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Last Updated:</span>
                  <span className="text-foreground">{new Date(submission.last_updated).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Current Level:</span>
                  <span className="text-foreground font-medium">{submission.current_reviewer_level}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
              <p className="text-sm text-foreground-secondary bg-card-secondary p-3 rounded-lg border border-border">
                {submission.description || "No description provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Approval History */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Approval History ({submission.approval_history.length} records)
          </h4>
          
          {submission.approval_history.length === 0 ? (
            <div className="text-center py-4 text-sm text-foreground-muted bg-card-secondary rounded-lg border border-dashed border-border">
              <Clock className="h-6 w-6 mx-auto mb-2 text-foreground-muted" />
              <p>No approval records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submission.approval_history
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((record, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-card-secondary rounded-lg border border-border">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      record.action === 1 ? 'bg-green-500' : 
                      record.action === 2 ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{record.reviewer_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getActionColor(record.action)}`}>
                          {getActionText(record.action)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-secondary mb-1">
                        Level {record.hierarchy_level} • {new Date(record.timestamp).toLocaleDateString()}
                      </p>
                      {record.comments && (
                        <p className="text-sm text-foreground-muted bg-card p-2 rounded border border-border">
                          "{record.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {submission.state === DOCUMENT_STATES.IN_REVIEW && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground-secondary">Approval Progress</span>
              <span className="text-sm text-foreground">Level {submission.current_reviewer_level}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(submission.current_reviewer_level / 3) * 100}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onViewDetails && (
            <Button variant="outline" onClick={onViewDetails} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          )}
          
          {submission.state === DOCUMENT_STATES.IN_REVIEW && canReview && (
            <>
              <Button 
                variant="outline" 
                onClick={onReject}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={onApprove} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          
          {submission.state === DOCUMENT_STATES.APPROVED && canFund && (
            <Button onClick={onFund} className="flex-1">
              <DollarSign className="mr-2 h-4 w-4" />
              Release Funding
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default DocumentSubmissionCard;
