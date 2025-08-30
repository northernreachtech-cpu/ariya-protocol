import React, { } from 'react';
import Card from './Card';
import Button from './Button';
import { Users, Calendar, Star } from 'lucide-react';

interface OrganizerChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBecomeOrganizer: () => Promise<void>;
  isLoading?: boolean;
}

export const OrganizerChoiceModal: React.FC<OrganizerChoiceModalProps> = ({
  isOpen,
  onClose,
  onBecomeOrganizer,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Become an Organizer?
          </h2>
          
          <p className="text-foreground-secondary mb-6">
            Would you like to create events and manage them on our platform? 
            You can always become an organizer later from your dashboard.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">Create and manage events</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">Build your reputation</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Maybe Later
            </Button>
            <Button
              onClick={onBecomeOrganizer}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Yes, Create Organizer Profile'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
