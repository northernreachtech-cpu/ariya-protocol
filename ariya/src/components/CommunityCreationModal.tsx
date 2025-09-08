import React, { useState } from 'react';
import { X, Users, Shield, Star, Clock, Settings, MessageCircle, FileText, Calendar, UserCheck, Vote } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface CommunityCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onCreateCommunity: (config: CommunityConfig) => Promise<void>;
}

interface CommunityConfig {
  name: string;
  description: string;
  accessRequirements: {
    nftTypes: ("poa" | "completion")[];
    minimumRating?: number;
    timeLimit?: "permanent" | "event_duration" | number;
    customRequirements?: any[];
  };
  features: {
    forum: boolean;
    resources: boolean;
    calendar: boolean;
    directory: boolean;
    governance: boolean;
  };
  moderators: string[];
}

const CommunityCreationModal: React.FC<CommunityCreationModalProps> = ({
  isOpen,
  onClose,
  eventName,
  onCreateCommunity,
}) => {
  const [formData, setFormData] = useState<CommunityConfig>({
    name: `${eventName} Community`,
    description: `Join the exclusive community for ${eventName} participants.`,
    accessRequirements: {
      nftTypes: [],
      minimumRating: undefined,
      timeLimit: "permanent",
    },
    features: {
      forum: true,
      resources: true,
      calendar: false,
      directory: true,
      governance: false,
    },
    moderators: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAccessRequirementChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      accessRequirements: {
        ...prev.accessRequirements,
        [field]: value,
      },
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature as keyof typeof prev.features],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateCommunity(formData);
      onClose();
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOpenCommunity = formData.accessRequirements.nftTypes.length === 0 && 
                         !formData.accessRequirements.minimumRating;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Create Community</h2>
              <p className="text-sm text-foreground-secondary">for {eventName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Community Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter community name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Describe your community"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Access Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access Requirements
            </h3>

            {/* Community Type Indicator */}
            <div className={`p-4 rounded-lg border-2 ${isOpenCommunity ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'}`}>
              <div className="flex items-center gap-2">
                {isOpenCommunity ? (
                  <>
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">Open Community</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Closed Community</span>
                  </>
                )}
              </div>
              <p className="text-sm text-foreground-secondary mt-1">
                {isOpenCommunity 
                  ? "Anyone can join this community without restrictions."
                  : "Users must meet specific requirements to join this community."
                }
              </p>
            </div>

            {/* NFT Requirements */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                NFT Requirements
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.accessRequirements.nftTypes.includes('poa')}
                    onChange={(e) => {
                      const nftTypes = e.target.checked
                        ? [...formData.accessRequirements.nftTypes, 'poa']
                        : formData.accessRequirements.nftTypes.filter(type => type !== 'poa');
                      handleAccessRequirementChange('nftTypes', nftTypes);
                    }}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-foreground">Require Proof of Attendance NFT</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.accessRequirements.nftTypes.includes('completion')}
                    onChange={(e) => {
                      const nftTypes = e.target.checked
                        ? [...formData.accessRequirements.nftTypes, 'completion']
                        : formData.accessRequirements.nftTypes.filter(type => type !== 'completion');
                      handleAccessRequirementChange('nftTypes', nftTypes);
                    }}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-foreground">Require Completion NFT</span>
                </label>
              </div>
            </div>

            {/* Rating Requirements */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Minimum Event Rating
              </label>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.accessRequirements.minimumRating || ''}
                  onChange={(e) => handleAccessRequirementChange('minimumRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                />
                <span className="text-sm text-foreground-secondary">stars (leave empty for no requirement)</span>
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Access Duration
              </label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground-muted" />
                <select
                  value={formData.accessRequirements.timeLimit}
                  onChange={(e) => handleAccessRequirementChange('timeLimit', e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="permanent">Permanent Access</option>
                  <option value="event_duration">Event Duration Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Community Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Community Features
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features.forum}
                  onChange={() => handleFeatureToggle('forum')}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <MessageCircle className="h-4 w-4 text-foreground-muted" />
                <div>
                  <div className="font-medium text-sm text-foreground">Discussion Forum</div>
                  <div className="text-xs text-foreground-secondary">Enable community discussions</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features.resources}
                  onChange={() => handleFeatureToggle('resources')}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <FileText className="h-4 w-4 text-foreground-muted" />
                <div>
                  <div className="font-medium text-sm text-foreground">Resource Sharing</div>
                  <div className="text-xs text-foreground-secondary">Share files and resources</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features.calendar}
                  onChange={() => handleFeatureToggle('calendar')}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <Calendar className="h-4 w-4 text-foreground-muted" />
                <div>
                  <div className="font-medium text-sm text-foreground">Event Calendar</div>
                  <div className="text-xs text-foreground-secondary">Community event scheduling</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features.directory}
                  onChange={() => handleFeatureToggle('directory')}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <UserCheck className="h-4 w-4 text-foreground-muted" />
                <div>
                  <div className="font-medium text-sm text-foreground">Member Directory</div>
                  <div className="text-xs text-foreground-secondary">Browse community members</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.features.governance}
                  onChange={() => handleFeatureToggle('governance')}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <Vote className="h-4 w-4 text-foreground-muted" />
                <div>
                  <div className="font-medium text-sm text-foreground">Community Governance</div>
                  <div className="text-xs text-foreground-secondary">Enable voting and decision-making</div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CommunityCreationModal;
