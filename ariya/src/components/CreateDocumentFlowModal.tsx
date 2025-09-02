import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  Plus, 
  X, 
  Trash2,
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { type ChainParticipant } from '../lib/sdk/documentFlow';

interface CreateDocumentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (participants: ChainParticipant[]) => Promise<void>;
  isLoading?: boolean;
  eventName?: string;
}

const CreateDocumentFlowModal: React.FC<CreateDocumentFlowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  eventName = "Event"
}) => {
  const [participants, setParticipants] = useState<ChainParticipant[]>([]);
  const [newParticipant, setNewParticipant] = useState({
    address: '',
    name: '',
    hierarchy_level: 1,
    role: ''
  });

  const addParticipant = () => {
    if (newParticipant.address && newParticipant.name && newParticipant.role) {
      // Check if hierarchy level is unique
      const levelExists = participants.some(p => p.hierarchy_level === newParticipant.hierarchy_level);
      if (levelExists) {
        alert('Hierarchy level must be unique for each participant');
        return;
      }

      setParticipants([...participants, { ...newParticipant }]);
      setNewParticipant({
        address: '',
        name: '',
        hierarchy_level: participants.length + 2,
        role: ''
      });
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
    // Recalculate hierarchy levels
    setParticipants(prev => 
      prev.map((p, i) => ({ ...p, hierarchy_level: i + 1 }))
    );
  };

  const moveParticipant = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newParticipants = [...participants];
      [newParticipants[index], newParticipants[index - 1]] = [newParticipants[index - 1], newParticipants[index]];
      setParticipants(newParticipants.map((p, i) => ({ ...p, hierarchy_level: i + 1 })));
    } else if (direction === 'down' && index < participants.length - 1) {
      const newParticipants = [...participants];
      [newParticipants[index], newParticipants[index + 1]] = [newParticipants[index + 1], newParticipants[index]];
      setParticipants(newParticipants.map((p, i) => ({ ...p, hierarchy_level: i + 1 })));
    }
  };

  const handleSubmit = async () => {
    if (participants.length < 1) {
      alert('Please add at least 1 participant to create a document flow');
      return;
    }
    await onSubmit(participants);
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
                  Create Document Flow
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Setup approval workflow for {eventName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Instructions */}
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup Instructions
              </h3>
              <ul className="text-sm text-foreground-secondary space-y-1">
                <li>• Add participants in order of approval hierarchy (Level 1 = first reviewer)</li>
                <li>• Each participant must have a unique hierarchy level</li>
                <li>• Documents will flow from lowest to highest level</li>
                <li>• Only top-level approvers can release funding</li>
                <li>• At least 1 participant is required (can be just the organizer)</li>
              </ul>
            </div>

            {/* Add Participant Form */}
            <div className="mb-6 p-4 bg-card-secondary rounded-lg border border-border">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Participant
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Wallet Address</label>
                  <input
                    type="text"
                    value={newParticipant.address}
                    onChange={(e) => setNewParticipant({ ...newParticipant, address: e.target.value })}
                    placeholder="0x..."
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                    placeholder="Finance Manager"
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hierarchy Level</label>
                  <input
                    type="number"
                    value={newParticipant.hierarchy_level}
                    onChange={(e) => setNewParticipant({ ...newParticipant, hierarchy_level: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <Button 
                onClick={addParticipant} 
                className="mt-3"
                disabled={!newParticipant.address || !newParticipant.name || !newParticipant.role}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Participant
              </Button>
            </div>

            {/* Participants List */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Approval Chain ({participants.length} participants)
              </h3>
              
              {participants.length === 0 ? (
                <div className="text-center py-8 text-sm text-foreground-muted bg-card-secondary rounded-lg border border-dashed border-border">
                  <Users className="h-8 w-8 mx-auto mb-2 text-foreground-muted" />
                  <p>No participants added yet</p>
                  <p className="text-xs mt-1">Add participants to create the approval workflow</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants
                    .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
                    .map((participant, index) => (
                      <div key={participant.address} className="flex items-center justify-between p-3 bg-card-secondary rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                            {participant.hierarchy_level}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{participant.name}</p>
                            <p className="text-xs text-foreground-secondary">{participant.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-foreground-muted font-mono">
                            {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveParticipant(index, 'up')}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveParticipant(index, 'down')}
                              disabled={index === participants.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(index)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Hierarchy Preview */}
            {participants.length > 0 && (
              <div className="mb-6 p-4 bg-card-secondary rounded-lg border border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">Approval Flow Preview</h3>
                <div className="space-y-2">
                  {participants
                    .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
                    .map((participant, index) => (
                      <div key={participant.address} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                          {participant.hierarchy_level}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{participant.name}</p>
                          <p className="text-xs text-foreground-secondary">{participant.role}</p>
                        </div>
                        {index < participants.length - 1 && (
                          <div className="w-px h-8 bg-border mx-2"></div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={isLoading || participants.length < 1}
            >
              {isLoading ? 'Creating...' : 'Create Document Flow'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateDocumentFlowModal;
