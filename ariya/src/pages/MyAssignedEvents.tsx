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
  Search,
  QrCode,
  CheckCircle,
  X
} from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { useZkLogin } from "../contexts/ZkLoginContext";
import Card from "../components/Card";
import Button from "../components/Button";
import QRScanner from "../components/QRScanner";
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
  const attendanceRegistryId = useNetworkVariable("attendanceRegistryId");
  const registrationRegistryId = useNetworkVariable("registrationRegistryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [assignedEvents, setAssignedEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "active" | "completed">("all");
  
  // Check-in functionality state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<string | null>(null);
  const [checkingInUser, setCheckingInUser] = useState(false);
  const [showCheckInSuccessModal, setShowCheckInSuccessModal] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState<{
    eventName: string;
    attendeeName: string;
  } | null>(null);
  
  // Event details modal state
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<AssignedEvent | null>(null);
  
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

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

  // Check-in handler for assignees
  const handleQRScan = async (qrData: any) => {
    if (!selectedEventForCheckIn || !attendanceRegistryId || !registrationRegistryId) {
      return;
    }

    setCheckingInUser(true);
    try {
      console.log("🔍 Starting check-in process for assignee...", {
        qrData,
        selectedEventForCheckIn,
        currentAccount: currentAccount?.address,
        attendanceRegistryId,
        registrationRegistryId,
      });

      // Validate QR data format
      let validation;
      if (qrData.pass_id && qrData.user_address) {
        // New format with pass_id
        validation = {
          isValid: true,
          attendeeAddress: qrData.user_address,
          passId: qrData.pass_id,
        };
      } else if (qrData.p && qrData.u) {
        // Short format
        validation = {
          isValid: true,
          attendeeAddress: qrData.u,
          passId: qrData.p,
        };
      } else {
        throw new Error("Invalid QR code format");
      }

      if (!validation.isValid) {
        throw new Error("Invalid QR code");
      }

      // Use the appropriate check-in method based on QR data format
      let tx;
      if (validation.passId) {
        // Use pass_id method
        tx = sdk.attendanceVerification.checkInAttendeeWithPassId(
          selectedEventForCheckIn,
          validation.attendeeAddress,
          validation.passId,
          attendanceRegistryId,
          registrationRegistryId
        );
      } else {
        // Use legacy method
        tx = sdk.attendanceVerification.checkInAttendee(
          selectedEventForCheckIn,
          validation.attendeeAddress,
          attendanceRegistryId,
          registrationRegistryId,
          qrData
        );
      }

      const result = await signAndExecute({ transaction: tx });
      console.log("✅ Check-in transaction successful:", result);

      // Show success modal
      const event = assignedEvents.find(e => e.id === selectedEventForCheckIn);
      setCheckInSuccessData({
        eventName: event?.name || 'Event',
        attendeeName: validation.attendeeAddress.slice(0, 8) + '...' + validation.attendeeAddress.slice(-6)
      });
      setShowCheckInSuccessModal(true);
      
      // Close scanner
      setShowQRScanner(false);
      setSelectedEventForCheckIn(null);
      
      // Refresh events to update attendee count
      await loadAssignedEvents(true);
    } catch (error) {
      console.error("❌ Check-in failed:", error);
      alert("Check-in failed. Please try again.");
    } finally {
      setCheckingInUser(false);
    }
  };

  const handleStartCheckIn = (eventId: string) => {
    setSelectedEventForCheckIn(eventId);
    setShowQRScanner(true);
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
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 sm:pt-24">
        <div className="text-center max-w-md mx-auto px-4">
          <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-foreground-muted" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary mb-4 sm:mb-6">
            Please connect your wallet or sign in with Google to view your assigned events.
          </p>
          <Button onClick={() => navigate("/")} className="w-full sm:w-auto">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 sm:pt-24">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
          <p className="text-sm sm:text-base text-foreground-secondary">Loading your assigned events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-6 sm:pb-8 lg:pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-livvic font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-1 sm:mb-2">
                My Assigned Events
              </h1>
              <p className="text-foreground-secondary text-xs sm:text-sm lg:text-base">
                Events you've been assigned to manage
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => loadAssignedEvents(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search events by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-card-secondary border border-border rounded-lg text-foreground placeholder-foreground-muted focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm sm:text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-foreground-muted flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-card-secondary border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm sm:text-base"
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
          <div className="space-y-3 sm:space-y-4">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="p-3 sm:p-4 lg:p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-3 mb-3 sm:mb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2 line-clamp-2">
                            {event.name}
                          </h3>
                          {event.description && (
                            <p className="text-foreground-secondary text-xs sm:text-sm mb-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                          <span
                            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
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
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {new Date(event.start_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {event.current_attendees || 0}/{event.capacity} attendees
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-foreground-muted flex-shrink-0" />
                        <span className="text-foreground-secondary">
                          {event.sponsors.length} sponsors
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 sm:mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-foreground-secondary">
                          Attendance
                        </span>
                        <span className="text-xs sm:text-sm text-foreground">
                          {Math.round(((event.current_attendees || 0) / (event.capacity || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-1.5 sm:h-2 rounded-full transition-all duration-500"
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
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate(`/event/${event.id}`)}
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Event
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedEventForDetails(event);
                          setShowEventDetailsModal(true);
                        }}
                        size="sm"
                        className="w-full"
                      >
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Event Details
                      </Button>
                    </div>
                    
                    {/* Check-in button for active events */}
                    {event.status === "active" && (
                      <Button
                        variant="outline"
                        onClick={() => handleStartCheckIn(event.id)}
                        disabled={checkingInUser}
                        size="sm"
                        className="w-full"
                      >
                        {checkingInUser ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        {checkingInUser ? "Checking In..." : "Check In Attendees"}
                      </Button>
                    )}
                    
                    {event.is_child && event.parent_id && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/event/${event.parent_id}`)}
                        size="sm"
                        className="w-full"
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Parent Event
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 sm:py-12 lg:py-16">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-foreground-muted" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground-secondary">
              {searchTerm || statusFilter !== "all" ? "No Events Found" : "No Assigned Events"}
            </h3>
            <p className="text-sm sm:text-base text-foreground-muted mb-4 sm:mb-6 max-w-md mx-auto px-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You haven't been assigned to manage any events yet. Event organizers can assign you to manage their events."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              {searchTerm || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate("/events")} className="w-full sm:w-auto">
                  Browse Events
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Event Details Modal for Assignees */}
      {showEventDetailsModal && selectedEventForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-lg">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words">{selectedEventForDetails.name}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(selectedEventForDetails.status)}`}>
                      {selectedEventForDetails.status.charAt(0).toUpperCase() + selectedEventForDetails.status.slice(1)}
                    </span>
                    <span className="text-foreground-secondary text-xs sm:text-sm">
                      {selectedEventForDetails.is_child ? "Sub-Event" : "Main Event"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowEventDetailsModal(false)} className="flex-shrink-0">
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Event Information */}
              <div className="bg-card-secondary rounded-lg p-4 sm:p-6 border border-border">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Event Information</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Description</label>
                    <p className="text-foreground mt-1 bg-card p-3 rounded-lg border border-border text-sm sm:text-base">
                      {selectedEventForDetails.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Location</label>
                    <p className="text-foreground mt-1 bg-card p-3 rounded-lg border border-border text-sm sm:text-base">
                      {selectedEventForDetails.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Timing */}
                <div className="bg-card-secondary rounded-lg p-4 sm:p-6 border border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Timing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Start Time</label>
                      <p className="text-foreground text-sm sm:text-base">
                        {new Date(selectedEventForDetails.start_time).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">End Time</label>
                      <p className="text-foreground text-sm sm:text-base">
                        {new Date(selectedEventForDetails.end_time).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Duration</label>
                      <p className="text-foreground text-sm sm:text-base">
                        {Math.floor((selectedEventForDetails.end_time - selectedEventForDetails.start_time) / (1000 * 60 * 60))}h{" "}
                        {Math.floor(((selectedEventForDetails.end_time - selectedEventForDetails.start_time) % (1000 * 60 * 60)) / (1000 * 60))}m
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-card-secondary rounded-lg p-4 sm:p-6 border border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Attendance
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Capacity</label>
                      <p className="text-foreground text-sm sm:text-base">{selectedEventForDetails.capacity} attendees</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Current Attendees</label>
                      <p className="text-foreground text-sm sm:text-base">{selectedEventForDetails.current_attendees || 0} attendees</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground-secondary">Progress</label>
                      <div className="mt-2">
                        <div className="w-full bg-border rounded-full h-1.5 sm:h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                ((selectedEventForDetails.current_attendees || 0) / (selectedEventForDetails.capacity || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
                          {Math.round(((selectedEventForDetails.current_attendees || 0) / (selectedEventForDetails.capacity || 1)) * 100)}% full
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignee Actions */}
              {selectedEventForDetails.status === "active" && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Assignee Actions
                  </h3>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
                      <strong>Your Role:</strong> As an assignee, you can help check in attendees for this event. 
                      You cannot activate, complete, or delete events - only the organizer can perform these actions.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowEventDetailsModal(false);
                      handleStartCheckIn(selectedEventForDetails.id);
                    }}
                    disabled={checkingInUser}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {checkingInUser ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    {checkingInUser ? "Checking In..." : "Check In Attendees"}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-border">
              <Button variant="outline" onClick={() => setShowEventDetailsModal(false)} className="w-full sm:w-auto" size="sm">
                Close
              </Button>
              <Button onClick={() => window.open(`/event/${selectedEventForDetails.id}`, '_blank')} className="w-full sm:w-auto" size="sm">
                View Public Page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Scan QR Code</h3>
            <p className="text-xs sm:text-sm text-foreground-secondary mb-3 sm:mb-4 text-center">
              Scan the attendee's QR code to check them in
            </p>
            <QRScanner
              isOpen={showQRScanner}
              eventId={selectedEventForCheckIn || ""}
              onScan={handleQRScan}
              onClose={() => {
                setShowQRScanner(false);
                setSelectedEventForCheckIn(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Check-in Success Modal */}
      {showCheckInSuccessModal && checkInSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 max-w-sm w-full mx-2 sm:mx-4 shadow-lg text-center">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-green-600" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-green-600">Check-in Successful!</h3>
            <p className="text-sm sm:text-base text-foreground mb-4">
              <span className="font-medium">{checkInSuccessData.attendeeName}</span> has been checked in to{" "}
              <span className="font-medium">{checkInSuccessData.eventName}</span>
            </p>
            <Button
              onClick={() => {
                setShowCheckInSuccessModal(false);
                setCheckInSuccessData(null);
              }}
              className="w-full"
              size="sm"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssignedEvents;
