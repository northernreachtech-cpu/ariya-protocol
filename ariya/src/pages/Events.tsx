import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  RefreshCw,
  ArrowRight,
  DollarSign,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import EventCardSkeleton from "../components/EventCardSkeleton";
import useScrollToTop from "../hooks/useScrollToTop";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { getWalrusImageUrl } from "../utils/walrus";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  attendees: number;
  maxAttendees: number;
  rating: number;
  image: string;
  category: string;
  price: string;
  organizer: string;
  state: number;
  fee_amount: number;
  start_time: number;
  end_time: number;
  is_child: boolean;
}

// Helper function to fetch metadata or handle direct image URLs
const fetchEventMetadata = async (metadataUri: string) => {
  try {
    if (!metadataUri || metadataUri === "") {
      return null;
    }
    
    // Check if it's a direct image URL (like ImgBB)
    if (metadataUri.startsWith('http') && (metadataUri.includes('.jpg') || metadataUri.includes('.jpeg') || metadataUri.includes('.png') || metadataUri.includes('.gif') || metadataUri.includes('.webp'))) {
      // It's a direct image URL, return it as the image
      return { image: metadataUri };
    }
    
    // If it's already a full URL, try to fetch as JSON metadata
    if (metadataUri.startsWith('http')) {
      const response = await fetch(metadataUri);
      if (response.ok) {
        return await response.json();
      }
    }
    
    // If it's a blob ID, construct the Walrus URL
    const walrusUrl = getWalrusImageUrl(metadataUri);
    const response = await fetch(walrusUrl);
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

const Events = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const registrationRegistryId = useNetworkVariable("registrationRegistryId");
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);

  const categories = [
    "all",
    "technology",
    "business",
    "music",
    "art",
    "sports",
    "education",
    "health",
  ];

  // Fetch real events from blockchain
  const loadEvents = async (forceRefresh = false) => {
    // Don't fetch if we already have data and it's not a forced refresh
    if (hasFetchedRef.current && !forceRefresh) {
      return;
    }

    try {
      setLoading(true);
      setRefreshing(forceRefresh);
      
      // Get all events from blockchain
      const allEvents = await sdk.eventManagement.getActiveEvents();
      const allProfiles = await sdk.eventManagement.getAllOrganizers();

      // Transform blockchain events to match UI interface with real data
      const transformedEvents: Event[] = await Promise.all(
        allEvents.map(async (event: any) => {
          const eventDate = new Date(event.start_time * 1000);
          const organizerProfile = allProfiles.find(
            (profile: any) => profile.organizer === event.organizer
          );

          // Fetch metadata from Walrus if available
          let metadata = null;
          let imageUrl = "";
          if (event.metadata_uri) {
            metadata = await fetchEventMetadata(event.metadata_uri);
            if (metadata?.image) {
              imageUrl = metadata.image;
            }
          }

          // Get real-time attendee count from registration system
          let realTimeAttendees = event.current_attendees || 0;
          try {
            const attendeeCount = await sdk.eventManagement.getEventAttendeeCount(
              event.id,
              registrationRegistryId
            );
            realTimeAttendees = attendeeCount;
          } catch (error) {
            // Fallback to stored count if real-time query fails
            realTimeAttendees = event.current_attendees || 0;
          }

          // Determine price display
          const feeAmount = event.fee_amount || 0;
          const price = feeAmount > 0 
                            ? `$${(feeAmount / 1000000000).toFixed(3)} Sui`
            : "Free";

          return {
            id: event.id,
            title: event.name,
            description: event.description || "Join this exciting event!",
            location: event.location || "Location TBD",
            date: eventDate.toISOString().split("T")[0],
            time: eventDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            attendees: realTimeAttendees,
            maxAttendees: event.capacity || 100,
            rating: organizerProfile?.avg_rating ? organizerProfile.avg_rating / 100 : 0,
            image: imageUrl || "/api/placeholder/400/250",
            category: metadata?.category || "technology",
            price,
            organizer: event.organizer,
            state: event.state,
            fee_amount: feeAmount,
            start_time: event.start_time,
            end_time: event.end_time,
            is_child: event.is_child || false,
          };
        })
      );

      // Filter out child events (sub-events) from the main events list
      const parentEventsOnly = transformedEvents.filter(event => !event.is_child);

      setEvents(parentEventsOnly);
      setFilteredEvents(parentEventsOnly);
      hasFetchedRef.current = true;
    } catch (error) {
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    hasFetchedRef.current = false;
    loadEvents(true);
  };

  useEffect(() => {
    // Only fetch if we haven't fetched before or if account/sdk changes
    if (!hasFetchedRef.current) {
      loadEvents();
    }
  }, [currentAccount, sdk]);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category === selectedCategory
      );
    }

    setFilteredEvents(filtered);
  }, [searchTerm, selectedCategory, events]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
              <div className="h-8 sm:h-12 bg-skeleton rounded w-48 sm:w-64"></div>
              <div className="w-full sm:w-20 h-8 bg-skeleton rounded"></div>
            </div>
            <div className="h-4 sm:h-6 bg-skeleton rounded w-80 sm:w-96 mx-auto"></div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="h-12 sm:h-14 bg-skeleton rounded-lg mb-4 sm:mb-6"></div>
              <div className="flex flex-wrap gap-2 justify-center px-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 sm:w-20 h-8 sm:h-10 bg-skeleton rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Events Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-livvic font-bold text-foreground">
              Discover Events
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed px-4">
            Find and join amazing events happening around you
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-4 sm:mb-6">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search events, locations, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-card border border-border rounded-lg text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center px-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-foreground-secondary hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12"
        >
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-foreground-muted text-lg mb-4">
                No events found matching your criteria
              </div>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div
                    className="h-full hover:shadow-lg transition-all duration-300 md:group cursor-pointer"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <Card className="h-full p-0 overflow-hidden md:overflow-visible" hover={true}>
                      {/* Event Image */}
                      <div 
                        className="relative bg-gradient-to-br from-primary/20 to-secondary/20 cursor-pointer overflow-hidden md:overflow-visible group md:group-hover:group"
                        style={{ aspectRatio: '16/9', minHeight: '200px' }}
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        {event.image && event.image !== "/api/placeholder/400/250" ? (
                          <div className="relative w-full h-full overflow-hidden md:overflow-visible">
                            <img 
                              src={event.image} 
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:object-contain group-hover:scale-150 group-hover:-translate-y-12 group-hover:z-50 transition-all duration-700 ease-out absolute inset-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 ease-out flex items-center justify-center z-40">
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200 transform translate-y-4 group-hover:translate-y-0">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                                  <Eye className="h-6 w-6 text-primary" />
                                </div>
                              </div>
                            </div>
                            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                              <span className="px-2 sm:px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
                                {event.fee_amount > 0 ? (
                                  <>
                                    <DollarSign className="h-3 w-3" />
                                    ${(event.fee_amount / 1000000000).toFixed(3)}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Free
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-full flex items-center justify-center group cursor-pointer" onClick={() => navigate(`/event/${event.id}`)}>
                            <div className="flex items-center justify-center h-full">
                              <Calendar className="h-16 w-16 text-white/60 group-hover:text-white/80 transition-colors duration-300" />
                            </div>
                            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                              <span className="px-2 sm:px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
                                {event.fee_amount > 0 ? (
                                  <>
                                    <DollarSign className="h-3 w-3" />
                                    ${(event.fee_amount / 1000000000).toFixed(3)}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Free
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-4 sm:p-6">
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-foreground-muted text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {event.description}
                          </p>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          <div className="flex items-center text-xs sm:text-sm text-foreground-secondary">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-foreground-secondary">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{formatDate(event.date)} at {event.time}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-foreground-secondary">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                            <span>{event.attendees}/{event.maxAttendees} attendees</span>
                          </div>
                          {event.rating > 0 && (
                            <div className="flex items-center text-xs sm:text-sm text-foreground-secondary">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-500 flex-shrink-0" />
                              <span>{event.rating.toFixed(1)}/5.0 rating</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs sm:text-sm text-foreground-secondary">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.state === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              event.state === 1 ? 'bg-green-500/20 text-green-400' :
                              event.state === 2 ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {event.state === 0 ? 'Created' :
                               event.state === 1 ? 'Active' :
                               event.state === 2 ? 'Completed' :
                               'Settled'}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          className="w-full group-hover:bg-primary/90 transition-all duration-200"
                          size="md"
                          onClick={() => {
                            navigate(`/event/${event.id}`);
                          }}
                        >
                          <span className="text-sm sm:text-base">View Details</span>
                          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {filteredEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-8 sm:mt-12"
          >
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Load More Events
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Events;
