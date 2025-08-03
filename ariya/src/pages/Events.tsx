import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Users, Star } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Card from "../components/Card";
import Button from "../components/Button";
import useScrollToTop from "../hooks/useScrollToTop";
import { useAriyaSDK } from "../lib/sdk";

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
}

const Events = () => {
  useScrollToTop();
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

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
  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await sdk.eventManagement.getActiveEvents();
      const allProfiles = await sdk.eventManagement.getAllOrganizers();

      // Transform blockchain events to match UI interface
      const transformedEvents: Event[] = allEvents.map((event: any) => {
        const eventDate = new Date(event.start_time * 1000);
        const organizerProfile = allProfiles.find(
          (profile: any) => profile.organizer === event.organizer
        );

        return {
          id: event.id,
          title: event.name,
          description: organizerProfile?.bio || "Join this exciting event!",
          location: organizerProfile?.address || "Location TBD",
          date: eventDate.toISOString().split("T")[0],
          time: eventDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          attendees: 0, // Will be fetched separately if needed
          maxAttendees: 100, // Default capacity
          rating: 0, // Will be fetched separately if needed
          image: "/api/placeholder/400/250",
          category: "technology", // Default category
          price: "Free", // Default price
          organizer: event.organizer,
          state: event.state,
        };
      });

      setEvents(transformedEvents);
      setFilteredEvents(transformedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
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
          <div className="flex items-center justify-center h-64">
            <div className="text-foreground">Loading events...</div>
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
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-livvic font-bold mb-4 text-foreground">
            Discover Events
          </h1>
          <p className="text-lg sm:text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
            Find and join amazing events happening around you
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted h-5 w-5" />
              <input
                type="text"
                placeholder="Search events, locations, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                    {/* Event Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg overflow-hidden mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300" />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium text-foreground">
                          {event.price}
                        </span>
                      </div>
                    </div>

                    {/* Event Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                          {event.title}
                        </h3>
                        <p className="text-foreground-muted text-sm leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-foreground-secondary">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-sm text-foreground-secondary">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.date)} at {event.time}
                        </div>
                        <div className="flex items-center text-sm text-foreground-secondary">
                          <Users className="h-4 w-4 mr-2" />
                          {event.attendees}/{event.maxAttendees} attendees
                        </div>
                        <div className="flex items-center text-sm text-foreground-secondary">
                          <Star className="h-4 w-4 mr-2 text-yellow-500" />
                          {event.rating} rating
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full" size="lg">
                        Join Event
                      </Button>
                    </div>
                  </Card>
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
            className="text-center"
          >
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Events;
