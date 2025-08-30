import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  Calendar, 
  Eye, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { useZkLogin } from "../contexts/ZkLoginContext";
import Card from "../components/Card";
import Button from "../components/Button";
import useScrollToTop from "../hooks/useScrollToTop";

interface AssignedEvent {
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
  sponsor_conditions: any;
  metadata_uri: string;
  fee_amount: number;
  title: string;
  date: string;
  status: "upcoming" | "active" | "completed";
}

const MyAssignedEvents = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const sdk = useAriyaSDK();
  const eventRegistryId = useNetworkVariable("eventRegistryId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [assignedEvents, setAssignedEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "active" | "completed">("all");

  const loadAssignedEvents = async (isRefresh = false) => {
    if (!activeAddress || !eventRegistryId || !profileRegistryId) {
      setAssignedEvents([]);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const events = await sdk.eventManagement.getMyAssignedEvents(activeAddress, eventRegistryId);
      
      // Get full event details for each assigned event
      const eventsWithDetails = await Promise.all(
        events.map(async (event) => {
          const fullEvent = await sdk.eventManagement.getEvent(event.id);
          if (fullEvent) {
            return {
              ...fullEvent,
              // Add UI-specific fields
              title: fullEvent.name,
              date: new Date(fullEvent.start_time).toISOString().split("T")[0],
              status: (fullEvent.state === 0
                ? "upcoming"
                : fullEvent.state === 1
                ? "active"
                : "completed") as "upcoming" | "active" | "completed",
            } as AssignedEvent;
          }
          // If full event not found, create a minimal AssignedEvent from EventInfo
          return {
            ...event,
            sponsors: [],
            assignee: "",
            is_child: false,
            parent_id: "",
            created_at: 0,
            sponsor_conditions: {},
            metadata_uri: "",
            fee_amount: 0,
            title: event.name,
            date: new Date(event.start_time).toISOString().split("T")[0],
            status: (event.state === 0
              ? "upcoming"
              : event.state === 1
              ? "active"
              : "completed") as "upcoming" | "active" | "completed",
          } as AssignedEvent;
        })
      );

      setAssignedEvents(eventsWithDetails);
    } catch (error) {
      setAssignedEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAssignedEvents();
    } else {
      setLoading(false);
    }
  }, [activeAddress, sdk, isAuthenticated]);

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

  const filteredEvents = assignedEvents.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-foreground-secondary mb-6">
            Please connect your wallet or sign in with Google to view your assigned events.
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground-secondary">Loading your assigned events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-livvic font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-2">
                My Assigned Events
              </h1>
              <p className="text-foreground-secondary text-sm sm:text-base">
                Events you've been assigned to manage
              </p>
            </div>
          </div>

          <Button
            onClick={() => loadAssignedEvents(true)}
            disabled={refreshing}
            variant="outline"
            className="flex-shrink-0"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search events by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card-secondary border border-border rounded-lg text-foreground placeholder-foreground-muted focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-foreground-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-card-secondary border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Events List */}
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="p-4 sm:p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 truncate">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="text-foreground-secondary text-sm mb-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        {event.is_child && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400">
                            Sub-Event
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {new Date(event.start_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {event.current_attendees || 0}/{event.capacity} attendees
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {event.sponsors.length} sponsors
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground-secondary">
                          Attendance
                        </span>
                        <span className="text-sm text-foreground">
                          {Math.round(((event.current_attendees || 0) / (event.capacity || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              ((event.current_attendees || 0) / (event.capacity || 1)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    <Button
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Event
                    </Button>
                    {event.is_child && event.parent_id && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/event/${event.parent_id}`)}
                        className="w-full lg:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        View Parent Event
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 sm:py-16">
            <Calendar className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />
            <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
              {searchTerm || statusFilter !== "all" ? "No Events Found" : "No Assigned Events"}
            </h3>
            <p className="text-foreground-muted mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You haven't been assigned to manage any events yet. Event organizers can assign you to manage their events."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {searchTerm || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate("/events")}>
                  Browse Events
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyAssignedEvents;
