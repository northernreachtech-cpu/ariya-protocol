import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { 
  type DocumentFlow, 
  type DocumentSubmission, 
  DOCUMENT_STATES 
} from '../lib/sdk/documentFlow';

interface DocumentFlowCardProps {
  flow?: DocumentFlow;
  submissions?: DocumentSubmission[];
  onViewFlow?: () => void;
  onCreateFlow?: () => void;
  onSubmitDocument?: () => void;
  onViewSubmissions?: () => void;
  isLoading?: boolean;
  eventName?: string;
}

const DocumentFlowCard: React.FC<DocumentFlowCardProps> = ({
  flow,
  submissions = [],
  onViewFlow,
  onCreateFlow,
  onSubmitDocument,
  onViewSubmissions,
  isLoading = false,
  eventName = "Event"
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
        return <CheckCircle className="h-4 w-4" />;
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

  if (!flow) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Document Flow Setup
          </h3>
          <p className="text-foreground-secondary mb-4">
            This event doesn't have a document approval workflow configured yet.
          </p>
          {onCreateFlow && (
            <Button onClick={onCreateFlow} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Setup Document Flow
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const activeSubmissions = submissions.filter(sub => 
    sub.state === DOCUMENT_STATES.IN_REVIEW || sub.state === DOCUMENT_STATES.APPROVED
  );

  const completedSubmissions = submissions.filter(sub => 
    sub.state === DOCUMENT_STATES.FUNDED || sub.state === DOCUMENT_STATES.REJECTED
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Document Flow
              </h3>
              <p className="text-sm text-foreground-secondary">
                {eventName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${flow.is_active ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20' : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20'}`}>
              {flow.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Approval Chain */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Approval Chain ({flow.chain_of_command.length} participants)
          </h4>
          <div className="space-y-2">
            {flow.chain_of_command
              .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
              .map((participant, index) => (
                <div key={participant.address} className="flex items-center justify-between p-3 bg-card-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{participant.name}</p>
                      <p className="text-xs text-foreground-secondary">{participant.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground-secondary">Level {participant.hierarchy_level}</p>
                    <p className="text-xs text-foreground-muted font-mono">
                      {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Document Submissions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Submissions ({submissions.length})
            </h4>
            {onViewSubmissions && (
              <Button variant="outline" size="sm" onClick={onViewSubmissions}>
                <Eye className="mr-1 h-3 w-3" />
                View All
              </Button>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-6 text-sm text-foreground-muted bg-card-secondary rounded-lg border border-dashed border-border">
              <FileText className="h-8 w-8 mx-auto mb-2 text-foreground-muted" />
              <p>No documents submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Submissions */}
              {activeSubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-card-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {getStatusIcon(submission.state)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{submission.title}</p>
                      <p className="text-xs text-foreground-secondary">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.state)}`}>
                      {getStatusText(submission.state)}
                    </span>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Show more indicator */}
              {activeSubmissions.length > 3 && (
                <div className="text-center py-2 text-xs text-foreground-muted">
                  +{activeSubmissions.length - 3} more active submissions
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-card-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-primary">{activeSubmissions.length}</div>
            <div className="text-xs text-foreground-secondary">Active</div>
          </div>
          <div className="text-center p-3 bg-card-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-green-600">{completedSubmissions.filter(s => s.state === DOCUMENT_STATES.FUNDED).length}</div>
            <div className="text-xs text-foreground-secondary">Funded</div>
          </div>
          <div className="text-center p-3 bg-card-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-red-600">{completedSubmissions.filter(s => s.state === DOCUMENT_STATES.REJECTED).length}</div>
            <div className="text-xs text-foreground-secondary">Rejected</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onViewFlow && (
            <Button variant="outline" onClick={onViewFlow} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          )}
          {onSubmitDocument && (
            <Button onClick={onSubmitDocument} className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Submit Document
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default DocumentFlowCard;
