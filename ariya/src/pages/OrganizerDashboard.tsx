import { useState, useEffect, useCallback } from "react";

import {
  Calendar,
  Users,
  Star,
  DollarSign,
  Eye,
  Settings,
  Plus,
  Loader2,
  Play,
  QrCode,
  Share2,
  MessageCircle,
  CheckCircle,
  Gift,
  Trash2,
  Copy,
  FileText,
  Upload,
  Clock,
  
  X,
 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { Transaction } from "@mysten/sui/transactions";
import { TelegramService } from "../lib/firebase";
import Card from "../components/Card";
import Button from "../components/Button";
import StatCard from "../components/StatCard";
import AirdropCreationModal from "../components/AirdropCreationModal";
// import AirdropAnalytics from "../components/AirdropAnalytics";
import AssigneeSelector from "../components/AssigneeSelector";
// import AirdropManagement from "../components/AirdropManagement";
import ErrorModal from "../components/ErrorModal";
import DocumentFlowCard from "../components/DocumentFlowCard";
import CreateDocumentFlowModal from "../components/CreateDocumentFlowModal";
import SubmitDocumentModal from "../components/SubmitDocumentModal";

import RatingStars from "../components/RatingStars";
import QRScanner from "../components/QRScanner";
import useScrollToTop from "../hooks/useScrollToTop";
import { suiClient } from "../config/sui";
import {
  type AirdropConfig,
  // type AirdropDetails,
  // type ClaimStatus,
} from "../lib/sdk";

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_time: number;
  end_time: number;
  capacity: number;
  current_attendees: number;
  organizer: string;
  sponsors: string[];
  assignee: string;
  is_child: boolean;
  parent_id: string;
  state: number;
  created_at: number;
  sponsor_conditions: {
    min_attendees: number;
    min_completion_rate: number;
    min_avg_rating: number;
    custom_benchmarks: Array<{
      metric_name: string;
      target_value: number;
      comparison_type: number;
    }>;
  };
  metadata_uri: string;
  fee_amount: number;
  // UI-specific fields
  status?: "upcoming" | "active" | "completed";
  checkedIn?: number;
  escrowStatus?: "pending" | "released" | "locked";
  rating?: number;
  revenue?: number;
}

// Registered Users List Component
const RegisteredUsersList = ({ eventId, sdk }: { eventId: string; sdk: any }) => {
  const [users, setUsers] = useState<Array<{ wallet: string; registeredAt: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const registeredUsers = await sdk.eventManagement.getEventRegisteredUsers(eventId);
        setUsers(registeredUsers);
      } catch (error) {
        console.error("Error loading registered users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [eventId, sdk]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-foreground-secondary">Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-4 text-foreground-secondary">
        No registered users yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {users.map((user, index) => (
        <div key={user.wallet} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <div>
              <div className="font-mono text-sm text-foreground">
                {user.wallet.slice(0, 8)}...{user.wallet.slice(-6)}
              </div>
              <div className="text-xs text-foreground-secondary">
                Registered {new Date(user.registeredAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(user.wallet)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Checked-in Users List Component
const CheckedInUsersList = ({ eventId, sdk }: { eventId: string; sdk: any }) => {
  const [users, setUsers] = useState<Array<{ wallet: string; checkedInAt: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const checkedInUsers = await sdk.eventManagement.getEventCheckedInUsers(eventId, "dummy");
        setUsers(checkedInUsers);
      } catch (error) {
        console.error("Error loading checked-in users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [eventId, sdk]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-foreground-secondary">Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-4 text-foreground-secondary">
        No checked-in users yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {users.map((user) => (
        <div key={user.wallet} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-400/20 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-sm text-foreground">
                {user.wallet.slice(0, 8)}...{user.wallet.slice(-6)}
              </div>
              <div className="text-xs text-foreground-secondary">
                Checked in {new Date(user.checkedInAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(user.wallet)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Event Details Modal component
const EventDetailsModal = ({
  isOpen,
  event,
  onClose,
  onUpdateAssignee,
  sdk,
  profileRegistryId,
  onShowActivateConfirm,
  onShowCompleteConfirm,
  onShowDeleteConfirm,
  onCreateCommunity,
  onSetEventMetadata,
  eventCommunities,
  checkingCommunities,
  creatingCommunity,
  eventsWithNFTEnabled,
  settingMetadataEvent,
}: {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onUpdateAssignee: (event: Event) => void;
  sdk: any;
  profileRegistryId: string;
  onShowActivateConfirm: (event: Event) => void;
  onShowCompleteConfirm: (event: Event) => void;
  onShowDeleteConfirm: (event: Event) => void;
  onCreateCommunity: (event: Event) => void;
  onSetEventMetadata: (event: Event) => void;
  eventCommunities: { [eventId: string]: any };
  checkingCommunities: { [eventId: string]: boolean };
  creatingCommunity: boolean;
  eventsWithNFTEnabled: { [eventId: string]: boolean };
  settingMetadataEvent: string | null;
}) => {
  const [assigneeProfile, setAssigneeProfile] = useState<{
    name: string;
    x_username: string;
    telegram_username: string;
  } | null>(null);
  const [loadingAssignee, setLoadingAssignee] = useState(false);

  // Fetch assignee profile information
  useEffect(() => {
    const fetchAssigneeProfile = async () => {
      if (!event || !event.assignee || event.assignee === "self") {
        setAssigneeProfile(null);
        return;
      }

      setLoadingAssignee(true);
      try {
        // Check if assignee is already a username format
        if (event.assignee.startsWith('@') || event.assignee.startsWith('t.me/')) {
          setAssigneeProfile({
            name: event.assignee,
            x_username: event.assignee.startsWith('@') ? event.assignee : '',
            telegram_username: event.assignee.startsWith('t.me/') ? event.assignee : '',
          });
          return;
        }

        // If it's an address, try to get the profile
        if (event.assignee.startsWith('0x')) {
          if (sdk && profileRegistryId) {
            const profile = await sdk.eventManagement.getUsernameFromAddress(event.assignee, profileRegistryId);
            
            if (profile) {
              setAssigneeProfile(profile);
            } else {
              // Fallback if no profile found
              setAssigneeProfile({
                name: `User (${formatAddress(event.assignee)})`,
                x_username: '',
                telegram_username: '',
              });
            }
          } else {
            // Fallback if SDK not available
            setAssigneeProfile({
              name: `User (${formatAddress(event.assignee)})`,
              x_username: '',
              telegram_username: '',
            });
          }
        } else {
          // Fallback for other formats
          setAssigneeProfile({
            name: event.assignee,
            x_username: '',
            telegram_username: '',
          });
        }
      } catch (error) {
        setAssigneeProfile({
          name: event.assignee.startsWith('0x') ? `User (${formatAddress(event.assignee)})` : event.assignee,
          x_username: '',
          telegram_username: '',
        });
      } finally {
        setLoadingAssignee(false);
      }
    };

    fetchAssigneeProfile();
  }, [event, sdk, profileRegistryId]);

  if (!isOpen || !event) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStateText = (state: number) => {
    switch (state) {
      case 0: return "Created";
      case 1: return "Active";
      case 2: return "Completed";
      case 3: return "Settled";
      default: return "Unknown";
    }
  };

  const getStateColor = (state: number) => {
    switch (state) {
      case 0: return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20";
      case 1: return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case 2: return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20";
      case 3: return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-400/20";
      default: return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20";
    }
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 10)}...${address.slice(-10)}`;
    }
    return address;
  };

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
      <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{event.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStateColor(event.state)}`}>
                  {getStateText(event.state)}
                </span>
                <span className="text-foreground-secondary text-sm">
                  {event.is_child ? "Sub-Event" : "Main Event"}
                </span>
                <span className="text-foreground-secondary text-sm">
                  Created {formatDate(event.created_at)}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <div className="bg-card-secondary rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Event Information
            </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">Description</label>
                    <p className="text-foreground mt-1 bg-card p-3 rounded-lg border border-border">
                      {event.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">Location</label>
                    <p className="text-foreground mt-1 bg-card p-3 rounded-lg border border-border">
                      {event.location}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">Event Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStateColor(event.state)}`}>
                        {getStateText(event.state)}
                      </span>
                      <span className="text-foreground-secondary text-sm">
                        {event.is_child ? "Sub-Event" : "Main Event"}
                    </span>
                  </div>
            </div>
                </div>
              </div>
        </div>

            {/* Timing Information */}
            <div>
              <div className="bg-card-secondary rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing
            </h3>
            <div className="space-y-4">
                      <div>
                    <label className="text-sm font-medium text-foreground-secondary">Start Time</label>
                    <p className="text-foreground mt-1 bg-card p-2 rounded border border-border text-sm">
                      {formatDate(event.start_time)}
                    </p>
                      </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">End Time</label>
                    <p className="text-foreground mt-1 bg-card p-2 rounded border border-border text-sm">
                      {formatDate(event.end_time)}
                    </p>
                    </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">Duration</label>
                    <p className="text-foreground mt-1 bg-card p-2 rounded border border-border text-sm font-medium">
                      {formatDuration(event.start_time, event.end_time)}
                    </p>
                  </div>
                </div>
              </div>
                    </div>
                  </div>
                  
          {/* Capacity, Attendance & Financial */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capacity & Attendance */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity & Attendance
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(event.capacity || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-foreground-secondary">Capacity</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {(event.current_attendees || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-foreground-secondary">Attendees</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground-secondary">Attendance Rate</span>
                    <span className="text-sm font-medium text-foreground">
                      {(event.capacity || 0) > 0 ? (((event.current_attendees || 0) / (event.capacity || 1)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(event.capacity || 0) > 0 ? ((event.current_attendees || 0) / (event.capacity || 1)) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
                  </div>

            {/* Financial Information */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {((event.fee_amount || 0) / 1000000000).toFixed(2)}
                    </div>
                    <div className="text-sm text-foreground-secondary">Fee (SUI)</div>
                    </div>
                  <div className="bg-card p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(((event.fee_amount || 0) * (event.current_attendees || 0)) / 1000000000).toFixed(2)}
                  </div>
                    <div className="text-sm text-foreground-secondary">Revenue (SUI)</div>
            </div>
                </div>
                <div className="bg-card p-3 rounded-lg border border-border">
                  <div className="text-sm text-foreground-secondary mb-1">Revenue Calculation</div>
                  <div className="text-xs text-foreground-muted">
                    {((event.fee_amount || 0) / 1000000000).toFixed(2)} SUI × {(event.current_attendees || 0)} attendees
                  </div>
                </div>
              </div>
        </div>
      </div>

          {/* Sponsors */}
          {event.sponsors.length > 0 && (
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Sponsors ({event.sponsors.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {event.sponsors.map((sponsor, index) => (
                  <div key={index} className="bg-card p-4 rounded-lg border border-border text-center hover:bg-card-secondary transition-colors">
                    <div className="text-lg font-semibold text-foreground">{sponsor}</div>
                    <div className="text-xs text-foreground-muted mt-1">Sponsor #{index + 1}</div>
              </div>
                ))}
            </div>
            </div>
          )}

          {/* Sponsor Conditions */}
          <div className="bg-card-secondary rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Sponsor Performance Conditions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(event.sponsor_conditions?.min_attendees || 0).toLocaleString()}
                  </div>
                <div className="text-sm text-foreground-secondary">Min Attendees</div>
                <div className="text-xs text-foreground-muted mt-1">Required for payout</div>
                  </div>
              <div className="bg-card p-4 rounded-lg border border-border text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((event.sponsor_conditions?.min_completion_rate || 0) / 100).toFixed(1)}%
                  </div>
                <div className="text-sm text-foreground-secondary">Min Completion Rate</div>
                <div className="text-xs text-foreground-muted mt-1">Event success threshold</div>
                    </div>
              <div className="bg-card p-4 rounded-lg border border-border text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {((event.sponsor_conditions?.min_avg_rating || 0) / 100).toFixed(1)}/5
                </div>
                <div className="text-sm text-foreground-secondary">Min Avg Rating</div>
                <div className="text-xs text-foreground-muted mt-1">Quality benchmark</div>
              </div>
                </div>
              </div>

          {/* Custom Benchmarks */}
          {event.sponsor_conditions?.custom_benchmarks?.length > 0 && (
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custom Benchmarks ({event.sponsor_conditions.custom_benchmarks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.sponsor_conditions.custom_benchmarks.map((benchmark, index) => (
                  <div key={index} className="bg-card p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-medium">{benchmark.metric_name}</span>
                      <span className="text-sm text-foreground-secondary">#{index + 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">Target Value:</span>
                      <span className="text-foreground font-medium">{benchmark.target_value}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-foreground-secondary">Comparison:</span>
                      <span className={`text-sm font-medium ${
                        benchmark.comparison_type === 0 ? 'text-green-600' : 
                        benchmark.comparison_type === 1 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {benchmark.comparison_type === 0 ? "≥ (Greater than or equal)" : 
                         benchmark.comparison_type === 1 ? "≤ (Less than or equal)" : 
                         "== (Equal to)"}
                          </span>
                        </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Management Details */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Event Management
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground-secondary">Assignee</label>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1">
                      {loadingAssignee ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-foreground-muted">Loading assignee info...</span>
                      </div>
                      ) : assigneeProfile ? (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">
                            {event.assignee === "self" ? "You (Event Organizer)" : assigneeProfile.name}
                    </div>
                          <div className="text-sm text-foreground-secondary">
                            {event.assignee === "self" ? (
                              "Managing this event yourself"
                            ) : (
                              <div className="space-y-1">
                                {event.assignee.startsWith('0x') && (
                                  <div className="font-mono text-xs text-foreground-muted">
                                    {formatAddress(event.assignee)}
                </div>
                                )}
                                <div className="flex items-center gap-2">
                                  {assigneeProfile.x_username && (
                                    <span className="text-blue-500 text-xs">@{assigneeProfile.x_username.replace('@', '')}</span>
                                  )}
                                  {assigneeProfile.telegram_username && (
                                    <span className="text-blue-500 text-xs">t.me/{assigneeProfile.telegram_username.replace('t.me/', '')}</span>
                                  )}
              </div>
            </div>
                            )}
              </div>
              </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">
                            {event.assignee === "self" ? "You (Event Organizer)" : event.assignee}
              </div>
                          {event.assignee !== "self" && (
                            <div className="text-sm text-foreground-secondary font-mono">
                              {formatAddress(event.assignee)}
            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateAssignee(event)}
                      className="ml-2 flex-shrink-0"
                    >
                      Edit
              </Button>
            </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground-secondary">Event Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.is_child ? 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400'
                    }`}>
                      {event.is_child ? "Sub-Event" : "Main Event"}
                    </span>
                  </div>
                </div>
                {event.is_child && (
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary">Parent Event ID</label>
                    <p className="text-foreground mt-1 font-mono text-xs bg-card p-2 rounded border border-border break-all">
                      {event.parent_id}
                    </p>
        </div>
      )}
                <div>
                  <label className="text-sm font-medium text-foreground-secondary">Event ID</label>
                  <p className="text-foreground mt-1 font-mono text-xs bg-card p-2 rounded border border-border break-all">
                    {event.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Media & Metadata
              </h3>
            <div className="space-y-4">
              <div>
                  <label className="text-sm font-medium text-foreground-secondary">Metadata URI</label>
                  <div className="mt-1">
                    {event.metadata_uri ? (
                      <div className="bg-card p-3 rounded border border-border">
                        <p className="text-foreground text-xs break-all">
                          {event.metadata_uri}
                        </p>
              </div>
                    ) : (
                      <p className="text-foreground-muted text-sm">No metadata provided</p>
                    )}
              </div>
                </div>
                {event.metadata_uri && (
              <div>
                    <label className="text-sm font-medium text-foreground-secondary">Banner Image</label>
                    <div className="mt-2">
                      <img 
                        src={event.metadata_uri} 
                        alt="Event banner" 
                        className="w-full h-40 object-cover rounded-lg border border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                />
              </div>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Registered and Checked-in Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registered Users */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Users ({event.current_attendees || 0})
              </h3>
              <RegisteredUsersList eventId={event.id} sdk={sdk} />
            </div>

            {/* Checked-in Users */}
            <div className="bg-card-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Checked-in Users
              </h3>
              <CheckedInUsersList eventId={event.id} sdk={sdk} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-border">
          {/* Event Actions */}
          <div className="flex flex-col gap-3">
            {/* Organizer Role Notice */}
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 text-sm">
                <strong>Organizer Role:</strong> You have full control over this event including activation, completion, and deletion.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
            {event.state === 0 && (
              <Button
                size="sm"
                onClick={() => {
                  onShowActivateConfirm(event);
                }}
              >
                <Play className="mr-1 h-3 w-3" />
                Activate Event
              </Button>
            )}
            
            {event.state === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onShowCompleteConfirm(event);
                }}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Complete Event
              </Button>
            )}
            
            {event.state === 0 && event.current_attendees === 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => {
                  onShowDeleteConfirm(event);
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete Event
              </Button>
            )}
            </div>
            
            {/* Sub-Event Management Actions */}
            {event.is_child && event.state === 1 && (
              <div className="mt-3 pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-foreground-secondary mb-2">Sub-Event Management</h4>
                <div className="flex flex-wrap gap-2">
                  {/* Create Community Button */}
                  {(() => {
                    const existingCommunity = eventCommunities[event.id];
                    const isChecking = checkingCommunities[event.id];

                    if (isChecking) {
                      return (
                        <Button
                          size="sm"
                          className="flex-1 min-w-[140px]"
                          variant="outline"
                          disabled={true}
                        >
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Checking...
                        </Button>
                      );
                    }

                    if (existingCommunity) {
                      return (
                        <Button
                          size="sm"
                          className="flex-1 min-w-[140px]"
                          variant="outline"
                          disabled={true}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Community Exists
                        </Button>
                      );
                    }

                    return (
                      <Button
                        size="sm"
                        className="flex-1 min-w-[140px]"
                        variant="outline"
                        onClick={() => onCreateCommunity(event)}
                        disabled={creatingCommunity}
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {creatingCommunity ? "Creating..." : "Create Community"}
                      </Button>
                    );
                  })()}
                  
                  {/* Enable NFT Minting Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[140px]"
                    onClick={() => onSetEventMetadata(event)}
                    disabled={
                      settingMetadataEvent === event.id ||
                      eventsWithNFTEnabled[event.id]
                    }
                  >
                    {settingMetadataEvent === event.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : eventsWithNFTEnabled[event.id] ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Settings className="mr-1 h-3 w-3" />
                    )}
                    {settingMetadataEvent === event.id
                      ? "Enabling..."
                      : eventsWithNFTEnabled[event.id]
                      ? "NFT Minting Enabled"
                      : "Enable NFT Minting"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right side buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => window.open(`/event/${event.id}`, '_blank')}>
              View Public Page
            </Button>
          </div>
        </div>
        </div>
    </div>
  );
};

// Simple SuccessModal component
const SuccessModal = ({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        onClick={onClose}
        className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg"
      >
        <h3 className="text-xl font-semibold text-green-600 mb-4">Success</h3>
        <p className="text-foreground mb-6">{message}</p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
};

// Skeleton loader component for organizer events
const OrganizerEventSkeleton = () => (
  <Card className="p-4 sm:p-6 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Event Info */}
      <div className="flex flex-col justify-between bg-card-secondary rounded-lg p-4 h-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="h-6 bg-skeleton rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-skeleton rounded w-1/2"></div>
          </div>
          <div className="h-5 bg-skeleton rounded w-16"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-skeleton rounded w-16"></div>
            <div className="h-4 bg-skeleton rounded w-12"></div>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-skeleton h-2 rounded-full w-1/3"></div>
          </div>
          <div className="h-3 bg-skeleton rounded w-12 mt-1"></div>
        </div>
      </div>

      {/* Event Stats */}
      <div className="flex flex-col justify-center bg-card-secondary rounded-lg p-4 h-full min-w-[180px]">
        <div className="flex flex-row items-center justify-between gap-4 mb-2">
          <div className="flex-1 text-center p-2 rounded bg-skeleton">
            <div className="h-3 bg-skeleton rounded w-12 mb-1"></div>
            <div className="h-4 bg-skeleton rounded w-16"></div>
          </div>
          <div className="flex-1 text-center p-2 rounded bg-skeleton">
            <div className="h-3 bg-skeleton rounded w-16 mb-1"></div>
            <div className="h-4 bg-skeleton rounded w-12"></div>
          </div>
        </div>
        <div className="text-center p-2 rounded bg-skeleton mt-2">
          <div className="h-3 bg-skeleton rounded w-12 mb-2"></div>
          <div className="h-4 bg-skeleton rounded w-20"></div>
        </div>
      </div>
    </div>
    {/* Actions Footer */}
    <div className="flex flex-wrap gap-2 mt-6 border-t border-border pt-4">
      <div className="h-8 bg-skeleton rounded flex-1"></div>
      <div className="h-8 bg-skeleton rounded flex-1"></div>
      <div className="h-8 bg-skeleton rounded flex-1"></div>
      <div className="h-8 bg-skeleton rounded flex-1"></div>
    </div>
  </Card>
);



const OrganizerDashboard = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sdk = useAriyaSDK();
  const eventRegistryId = useNetworkVariable("eventRegistryId");
  const attendanceRegistryId = useNetworkVariable("attendanceRegistryId");
  const registrationRegistryId = useNetworkVariable("registrationRegistryId");
  const nftRegistryId = useNetworkVariable("nftRegistryId");
  const communityRegistryId = useNetworkVariable("communityRegistryId");
  const airdropRegistryId = useNetworkVariable("airdropRegistryId");
  // const ratingRegistryId = useNetworkVariable("ratingRegistryId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const documentFlowRegistryId = useNetworkVariable("documentFlowRegistryId");

  const [loading, setLoading] = useState(true);
  const [activatingEvent, setActivatingEvent] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCheckOutScanner, setShowCheckOutScanner] = useState(false);
  const [selectedCheckOutEventId, setSelectedCheckOutEventId] = useState<
    string | null
  >(null);
  // const [organizerProfile, setOrganizerProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCheckInSuccessModal, setShowCheckInSuccessModal] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState<{
    userAddress: string;
    eventName: string;
  } | null>(null);
  const [settingMetadataEvent, setSettingMetadataEvent] = useState<
    string | null
  >(null);
  const [completingEvent, setCompletingEvent] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [eventToComplete, setEventToComplete] = useState<Event | null>(null);
  const [organizerProfileId, setOrganizerProfileId] = useState<string | null>(
    null
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventLink, setShareEventLink] = useState("");
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityEvent, setCommunityEvent] = useState<Event | null>(null);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [eventCommunities, setEventCommunities] = useState<{
    [eventId: string]: {
      id: string;
      name: string;
      description: string;
    } | null;
  }>({});
  const [checkingCommunities, setCheckingCommunities] = useState<{
    [eventId: string]: boolean;
  }>({});
  const [checkingInUser, setCheckingInUser] = useState(false);
  const [eventsWithNFTEnabled, setEventsWithNFTEnabled] = useState<{
    [eventId: string]: boolean;
  }>({});
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [selectedEventForAirdrop, setSelectedEventForAirdrop] =
    useState<Event | null>(null);
  const [creatingAirdrop, setCreatingAirdrop] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Document Flow state
  const [showDocFlowModal, setShowDocFlowModal] = useState(false);
  const [selectedEventForDocFlow, _setSelectedEventForDocFlow] = useState<Event | null>(null);
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const [showSubmitDocumentModal, setShowSubmitDocumentModal] = useState(false);
  const [creatingDocumentFlow, setCreatingDocumentFlow] = useState(false);
  const [documentFlowData, setDocumentFlowData] = useState<{
    [eventId: string]: {
      flow: any;
      submissions: any[];
      isLoading: boolean;
    };
  }>({});
  const [documentFlowStatus, setDocumentFlowStatus] = useState<{ [eventId: string]: boolean }>({});

  // Event Details Modal state
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<{ [parentId: string]: Event[] }>({});
  const [_loadingSubEvents, setLoadingSubEvents] = useState<{ [parentId: string]: boolean }>({});
  const [subEventPages, setSubEventPages] = useState<{ [parentId: string]: number }>({});
  
  // Confirmation modals state for EventDetailsModal
  const [showActivateConfirmModal, setShowActivateConfirmModal] = useState(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [eventToActivateFromDetails, setEventToActivateFromDetails] = useState<Event | null>(null);
  const [eventToCompleteFromDetails, setEventToCompleteFromDetails] = useState<Event | null>(null);
  const [eventToDeleteFromDetails, setEventToDeleteFromDetails] = useState<Event | null>(null);

  // Airdrop validation state
  // const [eventEligibleRecipients, setEventEligibleRecipients] = useState<{
  //   [eventId: string]: {
  //     checkedIn: number;
  //     checkedOut: number;
  //     totalAttendees: number;
  //   };
  // }>({});
  // const [validatingAirdrop, setValidatingAirdrop] = useState<{
  //   [eventId: string]: boolean;
  // }>({});

  // Delete event state
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  const [errorRetryAction, setErrorRetryAction] = useState<(() => void) | null>(
    null
  );

  // Assignee management state
  const [updatingAssignee, setUpdatingAssignee] = useState<string | null>(null);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [eventToUpdateAssignee, setEventToUpdateAssignee] = useState<Event | null>(null);
  const [newAssignee, setNewAssignee] = useState("");

  const eventsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  useEffect(() => {
    setCurrentPage(1);
  }, [events.length]);

  // Fetch organizer profile ID on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentAccount) return;
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${sdk.eventManagement.getPackageId()}::event_management::OrganizerCap`,
        },
        options: { showContent: true },
      });
      for (const obj of objects) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields;
          // Extract profileId as a string
          const fieldsTyped = fields as { profile_id?: string };
          const profileId = typeof fieldsTyped.profile_id === "string"
            ? fieldsTyped.profile_id
            : undefined;
          if (profileId) {
            setOrganizerProfileId(profileId);
            break;
          }
        }
      }
    };
    fetchProfile();
  }, [currentAccount, sdk]);

  const handleActivateEvent = async (eventId: string) => {
    try {
      setActivatingEvent(eventId);
      const tx = sdk.eventManagement.activateEvent(eventId, eventRegistryId);

      await signAndExecute({
        transaction: tx,
      });

      // Reload events to reflect the state change
      await loadOrganizerData();
    } catch {
      alert("Failed to activate event. Please try again.");
    } finally {
      setActivatingEvent(null);
    }
  };

  const handleCheckIn = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowQRScanner(true);
  };

  const handleCheckOut = (eventId: string) => {
    setSelectedCheckOutEventId(eventId);
    setShowCheckOutScanner(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQRScan = async (qrData: any) => {
    console.log("🔍 Starting check-in process...", {
      qrData,
      qrDataKeys: Object.keys(qrData),
      selectedEventId,
      currentAccount: currentAccount?.address,
      attendanceRegistryId,
      registrationRegistryId
    });
    
    setCheckingInUser(true);
    
    try {
      let userAddress = "";

      // Check if this is the short format (either original {p, u} or reconstructed {pass_id, user_address})
      if ((qrData.p && qrData.u) || (qrData.pass_id && qrData.user_address)) {
        console.log("🔍 QR Code analysis (short format):");
        console.log("  - event_id:", qrData.event_id || qrData.e);
        console.log("  - pass_id:", qrData.pass_id || qrData.p);
        console.log("  - user_address:", qrData.user_address || qrData.u);
        console.log("  - ref:", qrData.reference || qrData.ref);
        
        userAddress = qrData.user_address || qrData.u;
        
        // First, verify the user is registered for this event
        console.log("🔍 Checking if user is registered...");
        const isRegistered = await sdk.identityAccess.isRegistered(
          selectedEventId!,
          userAddress, // Use user_address from either format
          registrationRegistryId
        );
        console.log("📋 Registration status:", isRegistered);
        
        if (!isRegistered) {
          console.log("❌ User not registered for event");
          alert("User is not registered for this event. Please register first.");
          return;
        }

        // Get the registration details to see the stored pass hash
        console.log("🔍 Getting registration details...");
        try {
          const registration = await sdk.identityAccess.getRegistrationStatus(
            selectedEventId!,
            userAddress, // Use user_address from either format
            registrationRegistryId
          );
          console.log("📋 Registration details:", registration);
        } catch (error) {
          console.log("⚠️ Could not get registration details:", error);
        }

        // Use pass_id from the short format to generate pass hash
        console.log("📱 Using pass_id from short format");
        const passId = qrData.pass_id || qrData.p;
        const tx = sdk.attendanceVerification.checkInAttendeeWithPassId(
          selectedEventId!,
          userAddress, // Use user_address from either format
          passId, // Use pass_id as string to preserve precision
          attendanceRegistryId,
          registrationRegistryId
        );

        console.log("🚀 Executing check-in transaction...");
        console.log("👤 Current account:", currentAccount?.address);
        console.log("👤 QR User address:", userAddress);
        console.log("🔐 Transaction gas budget:", tx.getData().gasData);
        console.log("🔍 Transaction details:", {
          eventId: selectedEventId,
          userAddress: userAddress,
          passId: passId,
          attendanceRegistryId,
          registrationRegistryId
        });
        
        const result = await signAndExecute({
          transaction: tx,
        });
        console.log("✅ Check-in transaction successful:", result);

        // Show success modal instead of alert
        const event = events.find(e => e.id === selectedEventId);
        setCheckInSuccessData({
          userAddress: userAddress,
          eventName: event?.name || 'Event'
        });
        setShowCheckInSuccessModal(true);
      } else {
        console.log("📱 Using legacy QR format, validating...");
        // Fallback to old method for backward compatibility
        // Validate QR code
        
        const validation = await sdk.attendanceVerification.validateQRCode(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qrData as any,
          selectedEventId!
        );

        console.log("🔍 QR validation result:", validation);

        if (!validation.success) {
          console.log("❌ QR validation failed:", validation.message);
          alert(validation.message);
          return;
        }

        userAddress = validation.attendeeAddress!;

        // Check-in attendee
        const tx = sdk.attendanceVerification.checkInAttendee(
          selectedEventId!,
          validation.attendeeAddress!,
          attendanceRegistryId,
          registrationRegistryId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qrData as any
        );

        console.log("🚀 Executing check-in transaction (legacy)...");
        console.log("👤 Current account:", currentAccount?.address);
        console.log("🔐 Transaction gas budget:", tx.getData().gasData);
        
        const result = await signAndExecute({
          transaction: tx,
        });
        console.log("✅ Check-in transaction successful:", result);

        // Send check-in notification to the user
        const event = events.find(e => e.id === selectedEventId);
        if (event && validation.attendeeAddress) {
          try {
            await TelegramService.sendCheckInNotification(
              validation.attendeeAddress,
              event.name
            );
          } catch (error) {
            console.error("Failed to send check-in notification:", error);
            // Don't show error to user, just log it
          }
        }

        // Show success modal instead of alert
        setCheckInSuccessData({
          userAddress: validation.attendeeAddress!,
          eventName: event?.name || 'Event'
        });
        setShowCheckInSuccessModal(true);
      }

      // Verify capability transfer after successful check-in
      setTimeout(async () => {
        try {
          console.log("🔍 Verifying capability transfer...");
          const { data: objects } = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: {
              StructType: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::MintPoACapability`,
            },
            options: { showContent: true },
          });

          console.log("📦 Found capability objects:", objects.length);

          for (const obj of objects) {
            const content = obj.data?.content;
            if (
              content &&
              content.dataType === "moveObject" &&
              "fields" in content
            ) {
              const fields = (content as { fields: { event_id?: string } }).fields;
              if (fields && fields.event_id === selectedEventId) {
                console.log("✅ Capability transfer verified for event:", selectedEventId);
                break;
              }
            }
          }
        } catch (error) {
          console.log("⚠️ Error verifying capability transfer:", error);
        }
      }, 3000);

      // Reload events to update attendee count
      console.log("🔄 Reloading organizer data...");
      await loadOrganizerData();
    } catch (error) {
      console.error("❌ Check-in failed:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      alert("Failed to check in attendee. Please try again.");
    } finally {
      setCheckingInUser(false);
    }
  };

  const handleCheckOutQRScan = async (qrData: {
    user_address: string;
    event_id: string;
  }) => {
    try {
      // Expect qrData.user_address and qrData.event_id
      if (!qrData.user_address || !qrData.event_id) {
        setSuccessMessage("Invalid QR code for check-out");
        setShowSuccessModal(true);
        return;
      }
      const tx = sdk.attendanceVerification.checkOutAttendee(
        qrData.user_address,
        qrData.event_id,
        attendanceRegistryId
      );
      await signAndExecute({ transaction: tx });
      setSuccessMessage(
        `Successfully checked out ${qrData.user_address}. The attendee can now mint their Completion NFT!`
      );
      setShowSuccessModal(true);
      await loadOrganizerData();
    } catch {
      alert("Failed to check out attendee. Please try again.");
    }
  };

  const handleSetEventMetadata = async (event: Event) => {
    if (!nftRegistryId || !currentAccount) return;
    setSettingMetadataEvent(event.id);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${sdk.attendanceVerification.getPackageId()}::nft_minting::set_event_metadata`,
        arguments: [
          tx.pure.id(event.id),
          tx.pure.string(event.name),
          tx.pure.string(event.metadata_uri || ""),
          tx.pure.string(event.location || ""),
          tx.pure.address(currentAccount.address),
          tx.object(nftRegistryId),
        ],
      });
      await signAndExecute({ transaction: tx });
      setSuccessMessage("Event metadata set successfully for NFT minting!");
      setShowSuccessModal(true);
    } catch (e: unknown) {
      const error = e as { message?: string };
      setSuccessMessage(error.message || "Failed to set event metadata.");
      setShowSuccessModal(true);
    } finally {
      setSettingMetadataEvent(null);
    }
  };

  const handleCompleteEvent = (event: Event) => {
    setEventToComplete(event);
    setShowCompleteModal(true);
  };

  const handleDeleteEvent = (event: Event) => {
    // Check if event can be deleted
    if (event.state !== 0) {
      setErrorMessage("Only events in 'Created' state can be deleted.");
      setErrorDetails(new Error("Event is already active or completed"));
      setShowErrorModal(true);
      return;
    }

    if ((event.checkedIn || 0) > 0) {
      setErrorMessage("Cannot delete events that have attendees registered.");
      setErrorDetails(new Error("Event has attendees"));
      setShowErrorModal(true);
      return;
    }

    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmCompleteEvent = async () => {
    if (!eventToComplete || !organizerProfileId) return;
    setCompletingEvent(eventToComplete.id);
    try {
      const tx = sdk.eventManagement.completeEvent(
        eventToComplete.id,
        eventRegistryId,
        organizerProfileId
      );
      await signAndExecute({ transaction: tx });
      setSuccessMessage("Event marked as completed!");
      setShowSuccessModal(true);
      setShowCompleteModal(false);
      await loadOrganizerData();
    } catch (e: unknown) {
      // Enhanced error handling for Move abort codes
      const error = e as { message?: string };
      let message = error.message || "Failed to complete event.";
      if (
        message.includes("MoveAbort") &&
        message.includes('function_name: Some("complete_event")')
      ) {
        if (message.includes(", 1)")) {
          message = "You are not the organizer of this event.";
        } else if (message.includes(", 2)")) {
          message = "Event is not active. Only active events can be completed.";
        } else if (message.includes(", 3)")) {
          message =
            "Event cannot be completed until after its end time. Please wait until the event has ended.";
        } else {
          message = "Event completion failed due to a contract error.";
        }
      }
      setSuccessMessage(message);
      setShowSuccessModal(true);
    } finally {
      setCompletingEvent(null);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeletingEvent(eventToDelete.id);
    try {
      const tx = sdk.eventManagement.deleteEvent(
        eventToDelete.id,
        eventRegistryId
      );
      await signAndExecute({ transaction: tx });
      setSuccessMessage("Event deleted successfully!");
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      await loadOrganizerData();
    } catch (e: unknown) {
      // Enhanced error handling for Move abort codes
      const error = e as { message?: string };
      let message = error.message || "Failed to delete event.";
      if (
        message.includes("MoveAbort") &&
        message.includes('function_name: Some("delete_event")')
      ) {
        if (message.includes(", 1)")) {
          message = "You are not the organizer of this event.";
        } else if (message.includes(", 2)")) {
          message = "Event is not in 'Created' state. Only events that haven't been activated can be deleted.";
        } else if (message.includes(", 4)")) {
          message = "Event has attendees registered and cannot be deleted.";
        } else {
          message = "Event deletion failed due to a contract error.";
        }
      }
      setErrorMessage(message);
      setErrorDetails(error as Error);
      setShowErrorModal(true);
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleUpdateAssignee = (event: Event) => {
    setEventToUpdateAssignee(event);
    setNewAssignee(event.assignee);
    setShowAssigneeModal(true);
  };

  const confirmUpdateAssignee = async () => {
    if (!eventToUpdateAssignee || !newAssignee.trim()) return;
    setUpdatingAssignee(eventToUpdateAssignee.id);
    try {
      const tx = sdk.eventManagement.updateEventAssignee(
        eventToUpdateAssignee.id,
        newAssignee.trim(),
        eventRegistryId
      );
      await signAndExecute({ transaction: tx });
      setSuccessMessage("Event assignee updated successfully!");
      setShowSuccessModal(true);
      setShowAssigneeModal(false);
      await loadOrganizerData();
    } catch (e: unknown) {
      // Enhanced error handling for Move abort codes
      const error = e as { message?: string };
      let message = error.message || "Failed to update assignee.";
      if (
        message.includes("MoveAbort") &&
        message.includes('function_name: Some("update_event_assignee")')
      ) {
        if (message.includes(", 1)")) {
          message = "You are not the organizer of this event.";
        } else {
          message = "Assignee update failed due to a contract error.";
        }
      }
      setErrorMessage(message);
      setErrorDetails(error as Error);
      setShowErrorModal(true);
    } finally {
      setUpdatingAssignee(null);
    }
  };

  const checkEventCommunity = useCallback(async (eventId: string) => {
    if (!communityRegistryId) return;

    setCheckingCommunities((prev) => ({ ...prev, [eventId]: true }));
    try {
      const communities = await sdk.communityAccess.getEventCommunities(
        eventId,
        communityRegistryId
      );
      setEventCommunities((prev) => ({
        ...prev,
        [eventId]: communities.length > 0 ? communities[0] : null,
      }));
    } catch (e) {
      setEventCommunities((prev) => ({ ...prev, [eventId]: null }));
    } finally {
      setCheckingCommunities((prev) => ({ ...prev, [eventId]: false }));
    }
  }, [communityRegistryId, sdk]);

  const loadSubEvents = useCallback(async (parentEventId: string) => {
    if (!eventRegistryId) return;

    setLoadingSubEvents(prev => ({ ...prev, [parentEventId]: true }));
    try {
      // Use the new method to get child events
      const childEvents = await sdk.eventManagement.getChildEventsForParent(parentEventId);
      
      if (childEvents.length > 0) {
        const subEventDetails = await Promise.all(
          childEvents.map(async (event) => {
            const attendeeCount = await sdk.eventManagement.getEventAttendeeCount(
              event.id,
              eventRegistryId
            );
            
            return {
              ...event,
              checkedIn: attendeeCount,
              revenue: (event.fee_amount * attendeeCount) / 1000000000,
            };
          })
        );

        setSubEvents(prev => ({ ...prev, [parentEventId]: subEventDetails }));
        setSubEventPages(prev => ({ ...prev, [parentEventId]: 1 }));
      } else {
        setSubEvents(prev => ({ ...prev, [parentEventId]: [] }));
      }
    } catch (error) {
      setSubEvents(prev => ({ ...prev, [parentEventId]: [] }));
    } finally {
      setLoadingSubEvents(prev => ({ ...prev, [parentEventId]: false }));
    }
  }, [eventRegistryId, sdk]);

  const checkNFTMintingStatus = useCallback(async (eventId: string) => {
    if (!nftRegistryId) return;

    try {
      // Check if event has NFT metadata set by trying to get it
      const tx = new Transaction();
      tx.moveCall({
        target: `${sdk.attendanceVerification.getPackageId()}::nft_minting::get_event_metadata`,
        arguments: [tx.pure.id(eventId), tx.object(nftRegistryId)],
      });

      // If this call succeeds, NFT minting is enabled
      await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "0x0",
      });

      setEventsWithNFTEnabled((prev) => ({ ...prev, [eventId]: true }));
    } catch {
      // If this call fails, NFT minting is not enabled
      setEventsWithNFTEnabled((prev) => ({ ...prev, [eventId]: false }));
    }
  }, [nftRegistryId, sdk, currentAccount]);

  const handleCreateCommunity = async (event: Event) => {
    // Check if community already exists
    await checkEventCommunity(event.id);

    const existingCommunity = eventCommunities[event.id];
    if (existingCommunity) {
      setSuccessMessage(
        `A community already exists for this event: "${existingCommunity.name}". Only one community is allowed per event.`
      );
      setShowSuccessModal(true);
      return;
    }

    setCommunityEvent(event);
    setCommunityName(`${event.name} Community`);
    setCommunityDescription(
      `Join the live community for ${event.name} attendees`
    );
    setShowCommunityModal(true);
  };

  const confirmCreateCommunity = async () => {
    if (!communityEvent || !organizerProfileId || !communityRegistryId) return;
    setCreatingCommunity(true);
    try {
      const config = {
        name: communityName,
        description: communityDescription,
        accessRequirements: {
          nftTypes: ["poa", "completion"] as ("poa" | "completion")[], // Accept both PoA and Completion NFTs
          minimumRating: undefined,
          timeLimit: "event_duration" as const,
          customRequirements: [],
        },
        features: {
          forum: true,
          resources: false,
          calendar: false,
          directory: true,
          governance: false,
        },
        moderators: [currentAccount!.address],
      };

      const tx = sdk.communityAccess.createCommunity(
        communityEvent.id,
        config,
        communityRegistryId
      );

      await signAndExecute({ transaction: tx });
      setSuccessMessage(
        "Community created successfully! Attendees can now join with their PoA or Completion NFTs."
      );
      setShowSuccessModal(true);
      setShowCommunityModal(false);
      setCommunityName("");
      setCommunityDescription("");

      // Refresh community status for this event
      if (communityEvent) {
        await checkEventCommunity(communityEvent.id);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      let message = error.message || "Failed to create community.";

      // Handle specific Move abort codes
      if (message.includes("MoveAbort") && message.includes("7")) {
        message =
          "A community already exists for this event. Only one community is allowed per event.";
      } else if (message.includes("MoveAbort") && message.includes("1")) {
        message =
          "You are not the organizer of this event. Only event organizers can create communities.";
      } else if (message.includes("MoveAbort")) {
        message =
          "Failed to create community due to a contract error. Please try again.";
      }

      setSuccessMessage(message);
      setShowSuccessModal(true);
    } finally {
      setCreatingCommunity(false);
    }
  };

  // const handleCreateAirdrop = async (event: Event) => {
  //   // Check eligible recipients first
  //   await checkEligibleRecipients(event.id);

  //   const recipients = eventEligibleRecipients[event.id];

  //   // If no eligible recipients, show error modal instead
  //   if (!recipients || recipients.totalAttendees === 0) {
  //     setErrorMessage(
  //       "No eligible recipients found for this event. Ensure attendees have checked in or completed the event."
  //     );
  //     setErrorDetails(new Error("No eligible recipients"));
  //     setShowErrorModal(true);
  //     return;
  //   }

  //   setSelectedEventForAirdrop(event);
  //   setShowAirdropModal(true);
  // };

  const loadDocumentFlowData = async (eventId: string) => {
    console.log("🔄 Loading document flow data for event:", eventId);
    
    if (!documentFlowRegistryId) {
      console.error("❌ No document flow registry ID available");
      return;
    }

    console.log("🏛️ Document flow registry ID:", documentFlowRegistryId);

    setDocumentFlowData(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], isLoading: true }
    }));

    try {
      console.log("📡 Fetching document flow and submissions...");
      const [flow, submissions] = await Promise.all([
        sdk.documentFlow.getDocumentFlow(eventId),
        sdk.documentFlow.getDocumentSubmissions(eventId)
      ]);

      console.log("📋 Document flow result:", {
        flow: flow ? "Found" : "Not found",
        flowId: flow?.id,
        submissionsCount: submissions?.length || 0
      });

      setDocumentFlowData(prev => ({
        ...prev,
        [eventId]: {
          flow,
          submissions: submissions || [],
          isLoading: false
        }
      }));

      // Update document flow status
      const hasFlow = flow !== null;
      console.log("✅ Document flow status updated:", { eventId, hasFlow });
      setDocumentFlowStatus(prev => ({
        ...prev,
        [eventId]: hasFlow
      }));
    } catch (error) {
      console.error("❌ Error loading document flow data:", error);
      setDocumentFlowData(prev => ({
        ...prev,
        [eventId]: {
          flow: null,
          submissions: [],
          isLoading: false
        }
      }));
      
      // Update document flow status
      setDocumentFlowStatus(prev => ({
        ...prev,
        [eventId]: false
      }));
    }
  };

  const checkDocumentFlowStatus = async (eventIds: string[]) => {
    console.log("🔍 Checking document flow status for events:", eventIds);
    
    if (!documentFlowRegistryId) {
      console.error("❌ No document flow registry ID available for status check");
      return;
    }

    try {
      console.log("📡 Fetching document flow status...");
      const status = await sdk.documentFlow.getDocumentFlowStatus(eventIds);
      console.log("📋 Document flow status results:", status);
      setDocumentFlowStatus(prev => ({ ...prev, ...status }));
    } catch (error) {
      console.error("❌ Error checking document flow status:", error);
    }
  };

  // const handleOpenDocFlow = (event: Event) => {
  //   console.log("🚀 Opening document flow for event:", {
  //     eventId: event.id,
  //     eventName: event.name,
  //     hasExistingData: !!documentFlowData[event.id]
  //   });
    
  //   setSelectedEventForDocFlow(event);
  //   setShowDocFlowModal(true);
    
  //   // Load document flow data if not already loaded
  //   if (!documentFlowData[event.id]) {
  //     console.log("📡 Loading document flow data for event:", event.id);
  //     loadDocumentFlowData(event.id);
  //   } else {
  //     console.log("✅ Using existing document flow data for event:", event.id);
  //   }
  // };

  const handleCreateDocumentFlow = async (participants: any[]) => {
    if (!selectedEventForDocFlow || !documentFlowRegistryId || !currentAccount) {
      console.error("❌ Missing required data for document flow creation:", {
        selectedEventForDocFlow: !!selectedEventForDocFlow,
        documentFlowRegistryId: !!documentFlowRegistryId,
        currentAccount: !!currentAccount,
        eventId: selectedEventForDocFlow?.id,
        registryId: documentFlowRegistryId,
        userAddress: currentAccount?.address
      });
      return;
    }

    console.log("🚀 Starting document flow creation process...");
    console.log("📋 Event details:", {
      eventId: selectedEventForDocFlow.id,
      eventName: selectedEventForDocFlow.name,
      organizer: selectedEventForDocFlow.organizer,
      assignee: selectedEventForDocFlow.assignee
    });
    console.log("🔍 Authorization check:", {
      userAddress: currentAccount.address,
      eventOrganizer: selectedEventForDocFlow.organizer,
      eventAssignee: selectedEventForDocFlow.assignee,
      isOrganizer: currentAccount.address === selectedEventForDocFlow.organizer,
      isAssignee: currentAccount.address === selectedEventForDocFlow.assignee || selectedEventForDocFlow.assignee === "self"
    });
    console.log("👥 Participants:", participants);
    console.log("🏛️ Registry ID:", documentFlowRegistryId);
    console.log("👤 User address:", currentAccount.address);

    setCreatingDocumentFlow(true);
    try {
      console.log("📦 Creating transaction...");
      const tx = await sdk.documentFlow.createDocumentFlow(
        selectedEventForDocFlow.id,
        participants,
        "0x6", // CLOCK_ID
        documentFlowRegistryId,
        profileRegistryId,
        currentAccount.address // organizer address
      );

      // Test with dry run first
      console.log("🧪 Testing transaction with dry run...");
      try {
        const dryRunResult = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount?.address || "0x0"
        });
        console.log("🧪 Dry run result:", {
          status: dryRunResult.effects?.status?.status,
          events: (dryRunResult.effects as any)?.events?.length || 0,
          objectChanges: (dryRunResult.effects as any)?.objectChanges?.length || 0,
          error: (dryRunResult.effects as any)?.status?.error
        });
      } catch (dryRunError) {
        console.error("🧪 Dry run failed:", dryRunError);
      }

      console.log("⏳ Executing document flow transaction...");
      const result = await signAndExecute({ transaction: tx });
      
      console.log("🔍 Transaction result:", {
        digest: result.digest,
        status: (result.effects as any)?.status?.status,
        events: (result.effects as any)?.events?.length || 0,
        objectChanges: (result.effects as any)?.objectChanges?.length || 0,
        fullEffects: result.effects
      });
      
      // Check for Move abort errors
      if ((result.effects as any)?.status?.status === 'failure') {
        console.error("❌ Transaction failed:", (result.effects as any).status.error);
        throw new Error(`Transaction failed: ${(result.effects as any).status.error}`);
      }
      
      // Small delay to ensure blockchain state is updated
      console.log("⏳ Waiting 5 seconds for blockchain state update...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log("🔄 Reloading document flow data...");
      await loadDocumentFlowData(selectedEventForDocFlow.id);
      
      console.log("✅ Updating document flow status...");
      setDocumentFlowStatus(prev => ({
        ...prev,
        [selectedEventForDocFlow.id]: true
      }));
      
      console.log("🎉 Document flow creation completed successfully!");
      setShowCreateFlowModal(false);
    } catch (error) {
      console.error("❌ Document flow creation failed:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      alert("Failed to create document flow. Please try again.");
    } finally {
      console.log("🏁 Document flow creation process finished");
      setCreatingDocumentFlow(false);
    }
  };

  const handleSubmitDocument = async (documentData: {
    title: string;
    description: string;
    documentUri: string;
    documentType: string;
  }) => {
    if (!selectedEventForDocFlow || !documentFlowRegistryId || !currentAccount) return;

    // Get the flow ID from the document flow data
    const flowData = documentFlowData[selectedEventForDocFlow.id];
    if (!flowData?.flow?.id) {
      alert("Please create a document flow first before submitting documents.");
      return;
    }

    try {
      const tx = sdk.documentFlow.submitDocument(
        flowData.flow.id, // flowId
        selectedEventForDocFlow.id, // eventId
        documentData.title,
        documentData.description,
        documentData.documentUri,
        documentData.documentType,
        "0x6", // CLOCK_ID
        documentFlowRegistryId,
        profileRegistryId
      );

      await signAndExecute({ transaction: tx });
      
      // Reload document flow data
      await loadDocumentFlowData(selectedEventForDocFlow.id);
      setShowSubmitDocumentModal(false);
    } catch (error) {
      alert("Failed to submit document. Please try again.");
    }
  };

  const handleCreateSubEvent = (parentEvent: Event) => {
    // Navigate to create event page with parent event pre-filled
    navigate(`/event/create?parentId=${parentEvent.id}&parentName=${encodeURIComponent(parentEvent.name)}`);
  };

  const handleSubEventPageChange = (parentEventId: string, newPage: number) => {
    setSubEventPages(prev => ({ ...prev, [parentEventId]: newPage }));
  };

  const getSubEventsForPage = (parentEventId: string, page: number) => {
    const allSubEvents = subEvents[parentEventId] || [];
    const startIndex = (page - 1) * 4;
    const endIndex = startIndex + 4;
    return allSubEvents.slice(startIndex, endIndex);
  };

  const getTotalSubEventPages = (parentEventId: string) => {
    const allSubEvents = subEvents[parentEventId] || [];
    return Math.ceil(allSubEvents.length / 4);
  };

  // const checkEligibleRecipients = async (eventId: string) => {
  //   if (!attendanceRegistryId) return;

  //   setValidatingAirdrop((prev) => ({ ...prev, [eventId]: true }));

  //   try {
  //     // Query attendance stats for the event
  //     const tx = new Transaction();
  //     tx.moveCall({
  //       target: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::get_event_stats`,
  //       arguments: [tx.pure.id(eventId), tx.object(attendanceRegistryId)],
  //     });

  //     const result = await suiClient.devInspectTransactionBlock({
  //       transactionBlock: tx,
  //       sender: currentAccount?.address || "0x0",
  //     });

  //     if (result && result.results && result.results.length > 0) {
  //       const returnVals = result.results[0].returnValues;
  //       if (Array.isArray(returnVals) && returnVals.length >= 3) {
  //         const checkedIn = Array.isArray(returnVals[0])
  //           ? (returnVals[0] as unknown as number[])[0] || 0
  //           : parseInt(returnVals[0] as string) || 0;
  //         const checkedOut = Array.isArray(returnVals[1])
  //           ? (returnVals[1] as unknown as number[])[0] || 0
  //           : parseInt(returnVals[1] as string) || 0;
  //         const totalAttendees = checkedIn + checkedOut;

  //         setEventEligibleRecipients((prev) => ({
  //           ...prev,
  //           [eventId]: {
  //             checkedIn,
  //             checkedOut,
  //             totalAttendees,
  //           },
  //         }));
  //       }
  //     }
  //   } catch (error) {
  //     // Set default values if query fails
  //     setEventEligibleRecipients((prev) => ({
  //       ...prev,
  //       [eventId]: {
  //         checkedIn: 0,
  //         checkedOut: 0,
  //         totalAttendees: 0,
  //       },
  //     }));
  //   } finally {
  //     setValidatingAirdrop((prev) => ({ ...prev, [eventId]: false }));
  //   }
  // };

  const handleAirdropSubmit = async (config: AirdropConfig, amount: number) => {
    if (
      !selectedEventForAirdrop ||
      !currentAccount ||
      !airdropRegistryId ||
      !attendanceRegistryId
    ) {
      return;
    }

    setCreatingAirdrop(true);
    try {
      // Convert amount to SUI units (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(amount * 1000000000);

      // Get SUI coin from user's wallet
      const coinsResponse = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: "0x2::sui::SUI",
      });

      // Find a coin with sufficient balance
      const coinWithBalance = coinsResponse.data?.find(
        (coin: { balance: string }) => parseInt(coin.balance) >= amountInMist
      );

      if (!coinWithBalance) {
        throw new Error("Insufficient Sui balance for airdrop");
      }

      const tx = sdk.airdropDistribution.createAirdrop(
        selectedEventForAirdrop.id,
        config,
        coinWithBalance.coinObjectId,
        airdropRegistryId,
        attendanceRegistryId,
        profileRegistryId, // Added missing profileRegistryId
        "0x6" // CLOCK_ID
      );

      await signAndExecute({ transaction: tx });

      setSuccessMessage("Airdrop created successfully!");
      setShowSuccessModal(true);
      setShowAirdropModal(false);
      setSelectedEventForAirdrop(null);

      // Refresh organizer data to show new airdrop
      await loadOrganizerData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setErrorMessage(err.message || "Failed to create airdrop");
      setErrorDetails(error as Error);
      setErrorRetryAction(() => () => handleAirdropSubmit(config, amount));
      setShowErrorModal(true);
    } finally {
      setCreatingAirdrop(false);
    }
  };

  const loadOrganizerData = useCallback(async () => {
    if (!currentAccount) return;

    try {
      setLoading(true);
      // Check if user has profile
      const hasProfile = await sdk.eventManagement.hasOrganizerProfile(
        currentAccount.address
      );
      if (!hasProfile) {
        navigate("/dashboard");
        return;
      }

      // Get organizer's events
      const organizerEvents = await sdk.eventManagement.getEventsByOrganizer(
        currentAccount.address,
        eventRegistryId
      );

            // Transform events to match interface with full details
      const transformedEvents = await Promise.all(
        organizerEvents.map(async (event) => {
          // Get full event details
          const fullEventDetails = await sdk.eventManagement.getEvent(event.id);
          
          // Get real attendee count
          const attendeeCount = await sdk.eventManagement.getEventAttendeeCount(
            event.id,
            eventRegistryId
          );
          
          console.log("🔍 Organizer Dashboard - Event attendee count:", {
            eventId: event.id,
            eventName: fullEventDetails?.name,
            attendeeCount: attendeeCount,
            originalCurrentAttendees: fullEventDetails?.current_attendees
          });

          if (fullEventDetails) {
            const transformedEvent = {
              ...fullEventDetails,
              title: fullEventDetails.name, // Keep title for backward compatibility
              date: new Date(fullEventDetails.start_time).toISOString().split("T")[0],
              status: (fullEventDetails.state === 0
                ? "upcoming"
                : fullEventDetails.state === 1
                ? "active"
                : "completed") as "upcoming" | "active" | "completed",
              current_attendees: attendeeCount, // Update with real attendee count
              checkedIn: attendeeCount, // Use real attendee count
              totalCapacity: fullEventDetails.capacity,
              escrowStatus: "pending" as "pending" | "released" | "locked",
              rating: 0, // TODO: Get from event data
              revenue: (fullEventDetails.fee_amount * attendeeCount) / 1000000000, // Calculate revenue
              state: fullEventDetails.state,
            };
            
            console.log("🔍 Transformed event data:", {
              eventId: transformedEvent.id,
              eventName: transformedEvent.name,
              finalCurrentAttendees: transformedEvent.current_attendees,
              originalCurrentAttendees: fullEventDetails.current_attendees,
              realAttendeeCount: attendeeCount
            });
            
            console.log("✅ FINAL RESULT - Event will display:", {
              eventName: transformedEvent.name,
              current_attendees: transformedEvent.current_attendees,
              capacity: transformedEvent.capacity,
              percentage: `${((transformedEvent.current_attendees / transformedEvent.capacity) * 100).toFixed(1)}%`
            });
            
            return transformedEvent;
          } else {
            // Fallback to basic event info if full details not available
          return {
            id: event.id,
              name: event.name,
              description: "",
              location: "",
              start_time: event.start_time * 1000,
              end_time: event.start_time * 1000 + 7200000, // Default 2 hours
              capacity: 100,
              current_attendees: attendeeCount,
              organizer: currentAccount.address,
              sponsors: [],
              assignee: "self",
              is_child: false,
              parent_id: "0x0000000000000000000000000000000000000000000000000000000000000000",
              state: event.state,
              created_at: event.start_time * 1000,
              sponsor_conditions: {
                min_attendees: 0,
                min_completion_rate: 0,
                min_avg_rating: 0,
                custom_benchmarks: [],
              },
              metadata_uri: "",
              fee_amount: 0,
            title: event.name,
            date: new Date(event.start_time * 1000).toISOString().split("T")[0],
            status: (event.state === 0
              ? "upcoming"
              : event.state === 1
              ? "active"
              : "completed") as "upcoming" | "active" | "completed",
              checkedIn: attendeeCount,
              totalCapacity: 100,
            escrowStatus: "pending" as "pending" | "released" | "locked",
              rating: 0,
              revenue: 0,
          };
          }
        })
      );

      // Group events by parent-child relationships
      const parentEvents: Event[] = [];
      const childEventsMap: { [parentId: string]: Event[] } = {};

      // First, separate parent and child events
      transformedEvents.forEach(event => {
        if (event.is_child) {
          // This is a child event, group it by parent_id
          const parentId = event.parent_id;
          
          if (!childEventsMap[parentId]) {
            childEventsMap[parentId] = [];
          }
          childEventsMap[parentId].push(event);
        } else {
          // This is a parent event
          parentEvents.push(event);
        }
      });

      // Set the parent events as the main events list
      setEvents(parentEvents);

      // Set the child events map for display in sub-events sections
      setSubEvents(childEventsMap);

      // Check for existing communities for each event
      if (communityRegistryId) {
        for (const event of transformedEvents) {
          await checkEventCommunity(event.id);
        }
      }

      // Check NFT minting status for each event
      for (const event of transformedEvents) {
        await checkNFTMintingStatus(event.id);
      }

      // Check document flow status for all events
      const eventIds = transformedEvents.map(event => event.id);
      await checkDocumentFlowStatus(eventIds);


    } catch {
      // Only keep error log if needed for debugging
    } finally {
      setLoading(false);
    }
  }, [currentAccount, sdk, navigate, eventRegistryId, communityRegistryId, checkEventCommunity, checkNFTMintingStatus, loadSubEvents]);

  useEffect(() => {
    loadOrganizerData();
  }, [currentAccount, sdk, navigate, loadOrganizerData]);

  // Check if user has general profile and organizer status
  useEffect(() => {
    const checkProfiles = async () => {
      if (!currentAccount) return;

      const [hasGeneralProfile, hasOrganizerProfile] = await Promise.all([
        sdk.eventManagement.hasProfile(
          currentAccount.address,
          profileRegistryId
        ),
        sdk.eventManagement.hasOrganizerProfile(currentAccount.address),
      ]);

      if (!hasGeneralProfile) {
        // Redirect to home or show profile creation modal
        navigate("/");
        return;
      }

      if (!hasOrganizerProfile) {
        // Redirect to user dashboard if user is not an organizer
        navigate("/dashboard");
        return;
      }

      setIsOrganizer(hasOrganizerProfile);
    };

    checkProfiles();
  }, [currentAccount, sdk, navigate, profileRegistryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <div className="h-8 bg-skeleton rounded w-64 mb-2"></div>
              <div className="h-5 bg-skeleton rounded w-48"></div>
            </div>
            <div className="w-32 h-10 bg-skeleton rounded"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-4 sm:p-6 animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-skeleton rounded w-20"></div>
                  <div className="w-8 h-8 bg-skeleton rounded"></div>
                </div>
                <div className="h-8 bg-skeleton rounded w-16 mb-2"></div>
                <div className="h-3 bg-skeleton rounded w-24"></div>
              </div>
            ))}
          </div>

          {/* Events Section Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="h-6 bg-skeleton rounded w-32"></div>
            </div>
            <div className="grid gap-4 sm:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <OrganizerEventSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalEvents = events.length;
  const totalAttendees = events.reduce(
    (sum, event) => sum + (event.checkedIn || 0),
    0
  );
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const avgRating =
    events
      .filter((e) => (e.rating || 0) > 0)
      .reduce((sum, event) => sum + (event.rating || 0), 0) /
    events.filter((e) => (e.rating || 0) > 0).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case "completed":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20";
      case "upcoming":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20";
      default:
        return "text-foreground-muted bg-card-secondary";
    }
  };


  // const getAirdropButtonStatus = (event: Event) => {
  //   const recipients = eventEligibleRecipients[event.id];
  //   const isValidating = validatingAirdrop[event.id];

  //   if (isValidating) {
  //     return {
  //       disabled: true,
  //       text: "Checking Recipients...",
  //       icon: Loader2,
  //       variant: "outline" as const,
  //       className: "opacity-50",
  //       tooltip: "Validating eligible recipients...",
  //     };
  //   }

  //   if (!recipients) {
  //     return {
  //       disabled: false,
  //       text: "Create Airdrop",
  //       icon: Gift,
  //       variant: "outline" as const,
  //       className: "",
  //       tooltip: "Click to check eligible recipients",
  //     };
  //   }

  //   if (recipients.totalAttendees === 0) {
  //     return {
  //       disabled: true,
  //       text: "No Recipients",
  //       icon: Gift,
  //       variant: "outline" as const,
  //       className: "opacity-50 cursor-not-allowed",
  //       tooltip: `No eligible recipients found. Checked in: ${recipients.checkedIn}, Checked out: ${recipients.checkedOut}`,
  //     };
  //   }

  //   return {
  //     disabled: false,
  //     text: `Create Airdrop (${recipients.totalAttendees} eligible)`,
  //     icon: Gift,
  //     variant: "outline" as const,
  //     className: "",
  //     tooltip: `${recipients.checkedIn} checked in, ${recipients.checkedOut} checked out`,
  //   };
  // };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-livvic font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-2">
              {isOrganizer ? "Organizer Dashboard" : "User Dashboard"}
            </h1>
            <p className="text-foreground-secondary text-sm sm:text-base">
              {isOrganizer 
                ? "Manage your events and track performance"
                : "Ready to become an event organizer?"
              }
            </p>
          </div>

          {isOrganizer ? (
            <Button
              onClick={() => navigate("/event/create")}
              className="w-full sm:w-auto py-3 sm:py-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/profile/organizer/create")}
              className="w-full sm:w-auto py-3 sm:py-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Become Organizer
            </Button>
          )}
        </div>

        {isOrganizer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Events"
              value={totalEvents}
              icon={Calendar}
              color="primary"
              trend={{ value: 12, isPositive: true }}
              description="Events created"
            />
            <StatCard
              title="Total Attendees"
              value={totalAttendees}
              icon={Users}
              color="secondary"
              trend={{ value: 8, isPositive: true }}
              description="Across all events"
            />
            <StatCard
              title="Total Revenue"
              value={`${totalRevenue.toFixed(2)} SUI`}
              icon={DollarSign}
              color="accent"
              trend={{ value: 15, isPositive: true }}
              description="Registration earnings"
            />
            <StatCard
              title="Average Rating"
              value={avgRating ? avgRating.toFixed(1) : "0.0"}
              icon={Star}
              color="success"
              description="Event feedback"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Events Attended"
              value="0"
              icon={Calendar}
              color="primary"
              description="Your event history"
            />
            <StatCard
              title="Communities"
              value="0"
              icon={Users}
              color="secondary"
              description="Joined communities"
            />
            <StatCard
              title="Profile Status"
              value="Active"
              icon={CheckCircle}
              color="success"
              description="General user"
            />
            <StatCard
              title="Next Step"
              value="Organizer"
              icon={Plus}
              color="accent"
              description="Become an organizer"
            />
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {isOrganizer ? "Your Events" : "Get Started"}
            </h2>
          </div>
          {isOrganizer ? (
            events.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="mb-6">
                  <Calendar className="h-16 w-16 mx-auto text-foreground-muted" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
                  No events yet
                </h3>
                <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                  Create your first event to get started as an organizer.
                </p>
                <Button onClick={() => navigate("/event/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </div>
            ) : (
            <>
              <div className="grid gap-4 sm:gap-6">
                {loading
                  ? // Show skeleton loaders while loading
                    Array.from({ length: 3 }).map((_, index) => (
                      <OrganizerEventSkeleton key={index} />
                    ))
                  : currentEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="p-4 sm:p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                          {/* Event Info */}
                          <div className="flex flex-col justify-between bg-card-secondary rounded-lg p-4 h-full">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                              <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">
                                  {event.name}
                                </h3>
                                <p className="text-foreground-secondary text-sm">
                                  {new Date(event.start_time).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    event.status || "upcoming"
                                  )}`}
                                >
                                  {(event.status || "upcoming").charAt(0).toUpperCase() +
                                    (event.status || "upcoming").slice(1)}
                                </span>
                                {documentFlowStatus[event.id] && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                                    <FileText className="inline h-3 w-3 mr-1" />
                                    Doc Flow
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-foreground-secondary">
                                  Check-ins
                                </span>
                                <span className="text-sm text-foreground">
                                  {event.checkedIn || 0} / {event.capacity || 0}
                                </span>
                              </div>
                              <div className="w-full bg-border rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      ((event.checkedIn || 0) / (event.capacity || 1)) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-foreground-muted mt-1">
                                {Math.round(
                                  ((event.checkedIn || 0) / (event.capacity || 1)) * 100
                                )}
                                % capacity
                              </p>
                            </div>
                          </div>

                          {/* Event Stats */}
                          <div className="flex flex-col justify-center bg-card-secondary rounded-lg p-4 h-full min-w-[180px]">
                            <div className="flex flex-row items-center justify-center gap-4 mb-2">
                              {/* Event Registration Revenue */}
                              <div className="flex-1 text-center p-2 rounded bg-foreground-muted">
                                <div className="text-xs text-foreground-muted mb-1">
                                  Registration Revenue
                                </div>
                                <div className="text-sm font-medium text-foreground">
                                  {(event.revenue || 0).toFixed(2)} SUI
                                </div>
                              </div>
                            </div>
                            {/* Rating */}
                            {(event.rating || 0) > 0 && (
                              <div className="text-center p-2 rounded bg-foreground-muted mt-2">
                                <div className="text-xs text-foreground-muted mb-2">
                                  Rating
                                </div>
                                <RatingStars
                                  rating={event.rating || 0}
                                  size="sm"
                                  showLabel
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Actions Footer */}
                        <div className="mt-6 border-t border-border pt-4 space-y-3">
                          {/* Primary Actions Group */}
                          <div className="flex flex-wrap gap-2">
                            {event.state === 0 && (
                              <Button
                                size="sm"
                                className="flex-1 min-w-[120px]"
                                onClick={() => handleActivateEvent(event.id)}
                                disabled={activatingEvent === event.id}
                              >
                                {activatingEvent === event.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="mr-1 h-3 w-3" />
                                )}
                                {activatingEvent === event.id
                                  ? "Activating..."
                                  : "Activate"}
                              </Button>
                            )}

                            {event.state === 1 && (
                              <>
                                <Button
                                  size="sm"
                                  className="flex-1 min-w-[120px]"
                                  onClick={() => handleCheckIn(event.id)}
                                  disabled={checkingInUser}
                                >
                                  <QrCode className="mr-1 h-3 w-3" />
                                  {checkingInUser ? "Processing..." : "Check-in"}
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 min-w-[120px]"
                                  variant="secondary"
                                  onClick={() => handleCheckOut(event.id)}
                                >
                                  <QrCode className="mr-1 h-3 w-3" />
                                  Check-out
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 min-w-[120px]"
                                  variant="outline"
                                  onClick={() => handleCompleteEvent(event)}
                                  disabled={completingEvent === event.id}
                                >
                                  {completingEvent === event.id ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Play className="mr-1 h-3 w-3" />
                                  )}
                                  {completingEvent === event.id
                                    ? "Completing..."
                                    : "Complete Event"}
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Management Actions Group */}
                          <div className="flex flex-wrap gap-2">
                            {event.state === 1 && (
                              <>
                                {(() => {
                                  const existingCommunity =
                                    eventCommunities[event.id];
                                  const isChecking =
                                    checkingCommunities[event.id];

                                  if (isChecking) {
                                    return (
                                      <Button
                                        size="sm"
                                        className="flex-1 min-w-[140px]"
                                        variant="outline"
                                        disabled={true}
                                      >
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Checking...
                                      </Button>
                                    );
                                  }

                                  if (existingCommunity) {
                                    return (
                                      <Button
                                        size="sm"
                                        className="flex-1 min-w-[140px]"
                                        variant="outline"
                                        disabled={true}
                                      >
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Community Exists
                                      </Button>
                                    );
                                  }

                                  return (
                                    <Button
                                      size="sm"
                                      className="flex-1 min-w-[140px]"
                                      variant="outline"
                                      onClick={() =>
                                        handleCreateCommunity(event)
                                      }
                                      disabled={creatingCommunity}
                                    >
                                      <MessageCircle className="mr-1 h-3 w-3" />
                                      {creatingCommunity
                                        ? "Creating..."
                                        : "Create Community"}
                                    </Button>
                                  );
                                })()}
                                {/* {(() => {
                                  const airdropStatus =
                                    getAirdropButtonStatus(event);
                                  const AirdropIcon = airdropStatus.icon;

                                  return (
                                    <Button
                                      size="sm"
                                      className={`flex-1 min-w-[140px] ${airdropStatus.className}`}
                                      variant={airdropStatus.variant}
                                      onClick={() => handleCreateAirdrop(event)}
                                      disabled={
                                        airdropStatus.disabled ||
                                        creatingAirdrop
                                      }
                                    >
                                      {validatingAirdrop[event.id] ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      ) : (
                                        <AirdropIcon className="mr-1 h-3 w-3" />
                                      )}
                                      {creatingAirdrop
                                        ? "Creating..."
                                        : airdropStatus.text}
                                    </Button>
                                  );
                                })()} */}
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[140px]"
                              onClick={() => handleSetEventMetadata(event)}
                              disabled={
                                settingMetadataEvent === event.id ||
                                eventsWithNFTEnabled[event.id]
                              }
                            >
                              {settingMetadataEvent === event.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : eventsWithNFTEnabled[event.id] ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <Settings className="mr-1 h-3 w-3" />
                              )}
                              {settingMetadataEvent === event.id
                                ? "Enabling..."
                                : eventsWithNFTEnabled[event.id]
                                ? "NFT Minting Enabled"
                                : "Enable NFT Minting"}
                            </Button>
                            {/* <Button
                              variant="outline"
                              size="sm"
                              className={`flex-1 min-w-[140px] ${
                                documentFlowStatus[event.id] 
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30' 
                                  : ''
                              }`}
                              onClick={() => handleOpenDocFlow(event)}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              {documentFlowStatus[event.id] ? 'Document Flow ✓' : 'Document Flow'}
                            </Button> */}
                          </div>

                          {/* Utility Actions Group */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[100px]"
                              onClick={() => {
                                setShareEventLink(
                                  window.location.origin + "/event/" + event.id
                                );
                                setShowShareModal(true);
                              }}
                            >
                              <Share2 className="mr-1 h-3 w-3" />
                              Share
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[100px]"
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[100px]"
                              onClick={() => {
                                setSelectedEventForDetails(event);
                                setShowEventDetailsModal(true);
                              }}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              Details
                            </Button>
                            {event.state === 0 && event.checkedIn === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-w-[100px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleDeleteEvent(event)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete
                              </Button>
                            )}
                          </div>

                          {/* Sub-Events Section */}
                          <div className="mt-4 border-t border-border pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-foreground">
                                Sub-Events ({subEvents[event.id]?.length || 0})
                              </h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateSubEvent(event)}
                                className="text-xs"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Create Sub-Event
                              </Button>
                            </div>
                            
                            {subEvents[event.id] && subEvents[event.id].length > 0 ? (
                              <div>
                                {/* Sub-Events Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                  {getSubEventsForPage(event.id, subEventPages[event.id] || 1).map((subEvent) => (
                                    <div
                                      key={subEvent.id}
                                      className="bg-card-secondary rounded-lg border border-border hover:bg-card transition-all duration-200 cursor-pointer p-4 hover:shadow-md"
                                      onClick={() => {
                                        setSelectedEventForDetails(subEvent);
                                        setShowEventDetailsModal(true);
                                      }}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="text-sm font-semibold text-foreground line-clamp-2">
                                          {subEvent.name}
                                        </h5>
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(
                                            subEvent.state === 0 ? "upcoming" : subEvent.state === 1 ? "active" : "completed"
                                          )}`}
                                        >
                                          {subEvent.state === 0 ? "Upcoming" : subEvent.state === 1 ? "Active" : "Completed"}
                                        </span>
                                      </div>
                                      
                                      <div className="space-y-2 text-xs text-foreground-secondary">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(subEvent.start_time).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          <span>{subEvent.checkedIn || 0}/{subEvent.capacity} attendees</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="truncate">{subEvent.location}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-3 pt-2 border-t border-border">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-foreground-secondary">Registration Revenue:</span>
                                          <span className="font-medium text-foreground">
                                            {(subEvent.revenue || 0).toFixed(2)} SUI
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Pagination for Sub-Events */}
                                {getTotalSubEventPages(event.id) > 1 && (
                                  <div className="flex items-center justify-between">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSubEventPageChange(event.id, (subEventPages[event.id] || 1) - 1)}
                                      disabled={(subEventPages[event.id] || 1) <= 1}
                                      className="text-xs"
                                    >
                                      Previous
                                    </Button>
                                    <span className="text-xs text-foreground-secondary">
                                      Page {subEventPages[event.id] || 1} of {getTotalSubEventPages(event.id)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSubEventPageChange(event.id, (subEventPages[event.id] || 1) + 1)}
                                      disabled={(subEventPages[event.id] || 1) >= getTotalSubEventPages(event.id)}
                                      className="text-xs"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-sm text-foreground-muted bg-card-secondary rounded-lg border border-dashed border-border">
                                <div className="mb-2">
                                  <Plus className="h-8 w-8 mx-auto text-foreground-muted" />
                                </div>
                                <p>No sub-events yet</p>
                                <p className="text-xs mt-1">Create sub-events to organize related activities</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="mr-2"
                  >
                    Previous
                  </Button>
                  <span className="text-foreground-secondary text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="ml-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="mb-6">
                <Users className="h-16 w-16 mx-auto text-foreground-muted" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
                Ready to become an organizer?
              </h3>
              <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                Create an organizer profile to start hosting events and building communities.
              </p>
              <Button onClick={() => navigate("/profile/organizer/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Become Organizer
              </Button>
            </div>
          )}
        </div>

        {/* Airdrop Analytics Section */}
        {/* {isOrganizer && currentAccount?.address && (
          <div className="mb-6 sm:mb-8">
            <AirdropAnalytics organizerAddress={currentAccount.address} />
          </div>
        )} */}

        {/* QR Scanner Modal for Check-in */}
        {showQRScanner && selectedEventId && (
          <QRScanner
            isOpen={showQRScanner}
            onClose={() => {
              setShowQRScanner(false);
              setSelectedEventId(null);
            }}
            onScan={handleQRScan}
            eventId={selectedEventId}
          />
        )}
        {/* QR Scanner Modal for Check-out */}
        {showCheckOutScanner && selectedCheckOutEventId && (
          <QRScanner
            isOpen={showCheckOutScanner}
            onClose={() => {
              setShowCheckOutScanner(false);
              setSelectedCheckOutEventId(null);
            }}
            onScan={handleCheckOutQRScan}
            eventId={selectedCheckOutEventId}
          />
        )}
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
        {/* Check-in Success Modal */}
        {showCheckInSuccessModal && checkInSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 shadow-lg text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Check-in Successful!
                </h3>
                <p className="text-foreground-secondary mb-4">
                  Successfully checked in attendee for <strong>{checkInSuccessData.eventName}</strong>
                </p>
                <div className="bg-card-secondary rounded-lg p-4 mb-4">
                  <div className="text-sm text-foreground-secondary mb-1">Attendee Address:</div>
                  <div className="text-sm font-mono text-foreground break-all">
                    {checkInSuccessData.userAddress}
                  </div>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ PoA capability transferred successfully
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowCheckInSuccessModal(false);
                  setCheckInSuccessData(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {/* Event Details Modal */}
        <EventDetailsModal
          isOpen={showEventDetailsModal}
          event={selectedEventForDetails}
          onClose={() => {
            setShowEventDetailsModal(false);
            setSelectedEventForDetails(null);
          }}
          onUpdateAssignee={handleUpdateAssignee}
          sdk={sdk}
          profileRegistryId={profileRegistryId}
          onShowActivateConfirm={(event) => {
            setEventToActivateFromDetails(event);
            setShowActivateConfirmModal(true);
            setShowEventDetailsModal(false);
          }}
          onShowCompleteConfirm={(event) => {
            setEventToCompleteFromDetails(event);
            setShowCompleteConfirmModal(true);
            setShowEventDetailsModal(false);
          }}
          onShowDeleteConfirm={(event) => {
            setEventToDeleteFromDetails(event);
            setShowDeleteConfirmModal(true);
            setShowEventDetailsModal(false);
          }}
          onCreateCommunity={handleCreateCommunity}
          onSetEventMetadata={handleSetEventMetadata}
          eventCommunities={eventCommunities}
          checkingCommunities={checkingCommunities}
          creatingCommunity={creatingCommunity}
          eventsWithNFTEnabled={eventsWithNFTEnabled}
          settingMetadataEvent={settingMetadataEvent}
        />
        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          message={errorMessage}
          error={errorDetails}
          onRetry={errorRetryAction || undefined}
          onClose={() => {
            setShowErrorModal(false);
            setErrorMessage("");
            setErrorDetails(null);
            setErrorRetryAction(null);
          }}
          showDetails={true}
        />
        {/* Complete Event Confirmation Modal */}
        {showCompleteModal && eventToComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-primary">
                Complete Event
              </h3>
              <p className="text-foreground mb-6">
                Are you sure you want to mark{" "}
                                                <span className="font-bold">{eventToComplete.name}</span> as
                completed? This action cannot be undone and will allow attendees
                to rate your event.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={confirmCompleteEvent}
                  disabled={completingEvent === eventToComplete.id}
                  className="flex-1"
                >
                  {completingEvent === eventToComplete.id
                    ? "Completing..."
                    : "Yes, Complete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Event Confirmation Modal */}
        {showDeleteModal && eventToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Delete Event
              </h3>
              <p className="text-foreground mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold">{eventToDelete.name}</span>? This action cannot be undone and will permanently remove the event.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={confirmDeleteEvent}
                  disabled={deletingEvent === eventToDelete.id}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deletingEvent === eventToDelete.id
                    ? "Deleting..."
                    : "Yes, Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assignee Update Modal */}
        {showAssigneeModal && eventToUpdateAssignee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-primary">
                Update Event Assignee
              </h3>
              <p className="text-foreground mb-4">
                Update the assignee for <span className="font-bold">{eventToUpdateAssignee.name}</span>
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  New Assignee
                </label>
                <AssigneeSelector
                  value={newAssignee}
                  onChange={setNewAssignee}
                  placeholder="Enter assignee (address, @username, or t.me/username)"
                  disabled={updatingAssignee === eventToUpdateAssignee.id}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmUpdateAssignee}
                  disabled={updatingAssignee === eventToUpdateAssignee.id || !newAssignee.trim()}
                  className="flex-1"
                >
                  {updatingAssignee === eventToUpdateAssignee.id
                    ? "Updating..."
                    : "Update Assignee"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssigneeModal(false)}
                  className="flex-1"
                  disabled={updatingAssignee === eventToUpdateAssignee.id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-primary">
                Share Event
              </h3>
              <p className="text-foreground mb-4 break-all">{shareEventLink}</p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareEventLink);
                }}
                className="w-full mb-2"
              >
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Community Creation Modal */}
        {showCommunityModal && communityEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="relative bg-card backdrop-blur-2xl border border-border shadow-2xl rounded-2xl max-w-md w-full mx-4 p-0 overflow-hidden">
              <div className="flex flex-col items-center justify-center pt-8 pb-2 bg-gradient-to-r from-primary/80 to-secondary/80">
                <span className="text-5xl mb-2">🌐</span>
                <h3 className="text-2xl font-bold text-white drop-shadow mb-1 font-livvic">
                  Create Live Community
                </h3>
                <p className="text-white/80 text-sm mb-2 font-open-sans">
                  Create a community for checked-in attendees
                </p>
              </div>
              <div className="px-8 py-6 flex flex-col gap-4 font-open-sans">
                <div>
                  <label className="text-foreground-secondary text-sm font-semibold mb-1 font-livvic block">
                    Community Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border border-border bg-card-secondary text-foreground font-semibold focus:ring-2 focus:ring-primary/40 outline-none"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    disabled={creatingCommunity}
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary text-sm font-semibold mb-1 font-livvic block">
                    Description
                  </label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-border bg-card-secondary text-foreground font-semibold focus:ring-2 focus:ring-primary/40 outline-none"
                    rows={3}
                    value={communityDescription}
                    onChange={(e) => setCommunityDescription(e.target.value)}
                    disabled={creatingCommunity}
                  />
                </div>
                <div className="text-sm text-foreground-secondary bg-card-secondary p-3 rounded-lg">
                  <p>
                    <strong>Access:</strong> PoA or Completion NFT holders
                  </p>
                  <p>
                    <strong>Features:</strong> Forum, Resources, Directory
                  </p>
                  <p>
                    <strong>Duration:</strong> Active during event
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    onClick={confirmCreateCommunity}
                    disabled={creatingCommunity || !communityName.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 rounded-xl shadow-lg hover:from-secondary hover:to-primary transition-all text-base min-w-0 font-livvic"
                  >
                    {creatingCommunity ? "Creating..." : "Create Community"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCommunityModal(false)}
                    className="flex-1 border-0 bg-card-secondary text-foreground font-semibold py-2 rounded-xl hover:bg-card transition-all text-base min-w-0 font-livvic"
                    disabled={creatingCommunity}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Airdrop Creation Modal */}
        {showAirdropModal && selectedEventForAirdrop && (
          <AirdropCreationModal
            isOpen={showAirdropModal}
            onClose={() => {
              setShowAirdropModal(false);
              setSelectedEventForAirdrop(null);
              setCreatingAirdrop(false);
            }}
            onSubmit={handleAirdropSubmit}
            eventName={selectedEventForAirdrop.name}
            loading={creatingAirdrop}
          />
        )}

        {/* Document Flow Modal */}
        {showDocFlowModal && selectedEventForDocFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Document Flow Management
                  </h3>
                  <p className="text-foreground-secondary text-sm">
                    {selectedEventForDocFlow.name} • Approval Workflow
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocFlowModal(false)}
                >
                  Close
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <DocumentFlowCard
                  flow={documentFlowData[selectedEventForDocFlow.id]?.flow}
                  submissions={documentFlowData[selectedEventForDocFlow.id]?.submissions || []}
                  eventName={selectedEventForDocFlow.name}
                  isLoading={documentFlowData[selectedEventForDocFlow.id]?.isLoading || false}
                  onCreateFlow={() => setShowCreateFlowModal(true)}
                  onSubmitDocument={() => setShowSubmitDocumentModal(true)}
                  onViewFlow={() => {
                    // Could navigate to a detailed view or expand the card
                  }}
                  onViewSubmissions={() => {
                    // Could show a modal with all submissions
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Document Flow Modal */}
        {showCreateFlowModal && selectedEventForDocFlow && (
          <CreateDocumentFlowModal
            isOpen={showCreateFlowModal}
            onClose={() => setShowCreateFlowModal(false)}
            onSubmit={handleCreateDocumentFlow}
            isLoading={creatingDocumentFlow}
            eventName={selectedEventForDocFlow.name}
          />
        )}

        {/* Submit Document Modal */}
        {showSubmitDocumentModal && selectedEventForDocFlow && currentAccount && (
          <SubmitDocumentModal
            isOpen={showSubmitDocumentModal}
            onClose={() => setShowSubmitDocumentModal(false)}
            onSubmit={handleSubmitDocument}
            eventName={selectedEventForDocFlow.name}
            userAddress={currentAccount.address}
          />
        )}

        {/* Activate Event Confirmation Modal (from EventDetailsModal) */}
        {showActivateConfirmModal && eventToActivateFromDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-green-600">
                Activate Event
              </h3>
              <p className="text-foreground mb-6">
                Are you sure you want to activate{" "}
                <span className="font-bold">{eventToActivateFromDetails.name}</span>? This will make the event available for registration.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => {
                    handleActivateEvent(eventToActivateFromDetails.id);
                    setShowActivateConfirmModal(false);
                    setEventToActivateFromDetails(null);
                  }}
                  disabled={activatingEvent === eventToActivateFromDetails.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {activatingEvent === eventToActivateFromDetails.id
                    ? "Activating..."
                    : "Yes, Activate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivateConfirmModal(false);
                    setEventToActivateFromDetails(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Event Confirmation Modal (from EventDetailsModal) */}
        {showCompleteConfirmModal && eventToCompleteFromDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">
                Complete Event
              </h3>
              <p className="text-foreground mb-6">
                Are you sure you want to mark{" "}
                <span className="font-bold">{eventToCompleteFromDetails.name}</span> as
                completed? This action cannot be undone and will allow attendees
                to rate your event.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => {
                    handleCompleteEvent(eventToCompleteFromDetails);
                    setShowCompleteConfirmModal(false);
                    setEventToCompleteFromDetails(null);
                  }}
                  disabled={completingEvent === eventToCompleteFromDetails.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {completingEvent === eventToCompleteFromDetails.id
                    ? "Completing..."
                    : "Yes, Complete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCompleteConfirmModal(false);
                    setEventToCompleteFromDetails(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Event Confirmation Modal (from EventDetailsModal) */}
        {showDeleteConfirmModal && eventToDeleteFromDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Delete Event
              </h3>
              <p className="text-foreground mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold">{eventToDeleteFromDetails.name}</span>? This action cannot be undone and will permanently remove the event.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => {
                    handleDeleteEvent(eventToDeleteFromDetails);
                    setShowDeleteConfirmModal(false);
                    setEventToDeleteFromDetails(null);
                  }}
                  disabled={deletingEvent === eventToDeleteFromDetails.id}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deletingEvent === eventToDeleteFromDetails.id
                    ? "Deleting..."
                    : "Yes, Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setEventToDeleteFromDetails(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
