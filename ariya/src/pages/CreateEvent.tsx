import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MapPin,
  Users,
  Image,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useZkLogin } from "../contexts/ZkLoginContext";
import Button from "../components/Button";
import Card from "../components/Card";
import AssigneeSelector from "../components/AssigneeSelector";
import WalletConnectionPrompt from "../components/WalletConnectionPrompt";
import useScrollToTop from "../hooks/useScrollToTop";
import { suiClient, useNetworkVariable } from "../config/sui";
import { TelegramService } from "../lib/firebase";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";

// Get ImgBB API key from environment variable
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const CreateEvent = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const sdk = useAriyaSDK();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const eventRegistryId = useNetworkVariable("eventRegistryId");

  // Get parent event info from URL params
  const parentEventId = searchParams.get("parentId");
  const parentEventName = searchParams.get("parentName");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: null as dayjs.Dayjs | null,
    time: null as dayjs.Dayjs | null,
    maxAttendees: "",
    feeAmount: "", // Add fee amount field
    minAttendees: "", // Add sponsor conditions
    minCompletionRate: "",
    minAvgRating: "",
    sponsors: [] as string[], // Add sponsors array
    assignee: "self", // Add assignee field - default to "self"
    bannerImage: null as File | null,
    imageUrl: "", // Added for IPFS URL
    previewUrl: "", // Add this for local preview
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSponsor, setNewSponsor] = useState(""); // For adding new sponsors

  // Fetch organizer profile on component mount
  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      if (!activeAddress) return;

      try {
        setLoading(true);
        
        // Get organizer's OrganizerCap objects
        const { data: objects } = await suiClient.getOwnedObjects({
          owner: activeAddress,
          filter: {
            StructType: `${sdk.eventManagement.getPackageId()}::event_management::OrganizerCap`,
          },
          options: { showContent: true },
        });


        if (objects.length === 0) {
          navigate("/dashboard");
          return;
        }

        // Get profile ID from OrganizerCap
        const obj = objects[0];
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as {
            profile_id: string;
          };
          const organizerProfileId = fields.profile_id;
          
          // Verify the OrganizerProfile exists
          try {
            const profileResponse = await suiClient.getObject({
              id: organizerProfileId,
              options: { showContent: true },
            });
            
            if (profileResponse.data?.content?.dataType === "moveObject") {
              setProfileId(organizerProfileId);
            } else {
              setError("Organizer profile not found");
            }
          } catch (profileError) {
            setError("Failed to verify organizer profile");
          }
        }
      } catch (error) {
        setError("Failed to fetch organizer profile");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerProfile();
  }, [activeAddress, navigate, sdk]);

  const steps = [
    { id: 1, title: "Basic Info", icon: FileText },
    { id: 2, title: "Details", icon: MapPin },
    { id: 3, title: "Sponsors", icon: Users },
    { id: 4, title: "Media", icon: Image },
    { id: 5, title: "Review", icon: Users },
  ];

  // Sponsor management functions
  const addSponsor = () => {
    const trimmedSponsor = newSponsor.trim();
    if (trimmedSponsor && !formData.sponsors.includes(trimmedSponsor)) {
      setFormData(prev => ({
        ...prev,
        sponsors: [...prev.sponsors, trimmedSponsor]
      }));
      setNewSponsor("");
    }
  };

  const removeSponsor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: string, value: string | dayjs.Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleSponsorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSponsor();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          bannerImage: file,
          previewUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      const url = data.data.url;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (error) {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeAddress || !isAuthenticated) {
      setError("Please connect your wallet or sign in with Google");
      return;
    }

    if (!profileId) {
      setError("Organizer profile not found");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");


      // Convert date and time to timestamp (Move expects milliseconds)
      if (!formData.date || !formData.time) {
        setError("Please select both date and time for the event");
        setIsSubmitting(false);
        return;
      }
      
      const startTime = formData.date.hour(formData.time.hour()).minute(formData.time.minute()).valueOf();
      const endTime = startTime + 3600 * 2 * 1000; // Default 2 hours duration in milliseconds
      

      // Create event transaction with actual profileId
      const tx = sdk.eventManagement.createEvent(
        formData.title,
        formData.description,
        formData.location,
        startTime,
        endTime,
        parseInt(formData.maxAttendees) || 100,
        Math.floor(parseFloat(formData.feeAmount || "0") * 1000000000), // Convert SUI to MIST units
        parseInt(formData.minAttendees) || 0, // minAttendees
        parseInt(formData.minCompletionRate) || 0, // minCompletionRate
        parseInt(formData.minAvgRating) || 0, // minAvgRating
        formData.imageUrl || "", // metadataUri
        formData.sponsors, // sponsors from form data
        formData.assignee, // Use assignee from form data
        !!parentEventId, // isChild - true if parentEventId exists
        parentEventId || "0x0000000000000000000000000000000000000000000000000000000000000000", // parentId - use parentEventId if exists, otherwise zero ID
        eventRegistryId, // eventRegistryId
        profileId // organizerProfile
      );

      
      // Execute transaction
      if (currentAccount) {
        // For regular wallet
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async (result) => {

            // Extract event ID from the result
            const eventId =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sdk.eventManagement.extractEventIdFromResult(result as any);
            if (eventId) {
              
              // Send event creation notification to organizer
              if (activeAddress && formData.date && formData.time) {
                try {
                  await TelegramService.sendEventCreationNotification(
                    activeAddress,
                    formData.title,
                    formData.date.format('YYYY-MM-DD'),
                    formData.time.format('HH:mm')
                  );
                } catch (error) {
                }
              }
              
              // Schedule event reminder (24 hours before event)
              if (activeAddress && formData.date && formData.time) {
                try {
                  const eventDateTime = formData.date.hour(formData.time.hour()).minute(formData.time.minute());
                  const reminderTime = eventDateTime.subtract(24, 'hour');
                  const now = dayjs();
                  
                  if (reminderTime.isAfter(now)) {
                    const timeUntil = Math.ceil(reminderTime.diff(now, 'hour', true)); // hours
                    await TelegramService.scheduleEventReminder(
                      activeAddress,
                      formData.title,
                      formData.date.format('YYYY-MM-DD'),
                      `${timeUntil} hours`
                    );
                  }
                } catch (error) {
                }
              }
              
              // You can now use this event ID to fetch event details or navigate to event page
              navigate(`/event/${eventId}`);
                          } else {
                navigate("/dashboard/organizer");
              }
            },
            onError: () => {
              setError("Failed to create event. Please try again.");
            },
          }
        );
      } else {
        // For zkLogin
        const txWithSender = tx;
        txWithSender.setSender(activeAddress);
        
        signAndExecute(
          { transaction: txWithSender },
          {
            onSuccess: (result) => {

              // Extract event ID from the result
              const eventId =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sdk.eventManagement.extractEventIdFromResult(result as any);
              if (eventId) {
                // You can now use this event ID to fetch event details or navigate to event page
                navigate(`/event/${eventId}`);
              } else {
                navigate("/dashboard/organizer");
              }
            },
            onError: () => {
              setError("Failed to create event. Please try again.");
            },
          }
        );
      }
    } catch (error) {
      setError("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <WalletConnectionPrompt
        title="Connect Your Wallet"
        description="Please connect your wallet or sign in with Google to create events."
        icon={<Calendar className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-livvic font-bold mb-2 sm:mb-4 text-foreground">
            {parentEventId ? "Create Sub-Event" : "Create New Event"}
          </h1>
          <p className="text-foreground-secondary text-sm sm:text-base">
            {parentEventId 
              ? `Creating a sub-event for "${parentEventName}"`
              : "Set up your decentralized event in a few simple steps"
            }
          </p>
          {parentEventId && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <span className="mr-1">📋</span>
              Sub-Event
            </div>
          )}
        </div>

        {/* Mobile Progress Steps - Horizontal scroll on mobile */}
        <div className="mb-6 sm:mb-8">
          {/* Desktop version - hidden on mobile */}
          <div className="hidden sm:flex justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${
                      currentStep >= step.id
                        ? "bg-gradient-to-r from-primary to-secondary text-white"
                        : "bg-card border border-border text-foreground-muted"
                    }
                  `}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-foreground-muted"
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-4 ${
                        currentStep > step.id ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile version - current step indicator */}
          <div className="flex sm:hidden justify-between items-center bg-card border border-border rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-sm font-bold mr-3">
                {currentStep}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {steps[currentStep - 1].title}
                </div>
                <div className="text-xs text-foreground-muted">
                  Step {currentStep} of {steps.length}
                </div>
              </div>
            </div>
            <div className="text-xs text-foreground-muted">
              {Math.round((currentStep / steps.length) * 100)}%
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden mt-3">
            <div className="w-full bg-border rounded-full h-1">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-1 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="p-4 sm:p-6 lg:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
                Event Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-3 sm:py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base resize-none text-foreground placeholder-foreground-muted"
                  placeholder="Describe your event"
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
                Event Details
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                  placeholder="Enter event location"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Date
                  </label>
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => handleInputChange("date", date)}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    className="w-full"
                    size="large"
                    placeholder="Select date"
                    format="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Time
                  </label>
                  <TimePicker
                    value={formData.time}
                    onChange={(time) => handleInputChange("time", time)}
                    className="w-full"
                    size="large"
                    placeholder="Select time"
                    format="HH:mm"
                    minuteStep={15}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Max Attendees (Optional)
                </label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) =>
                    handleInputChange("maxAttendees", e.target.value)
                  }
                  onKeyDown={handleNumberKeyDown}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                  placeholder="No limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Fee Amount (Sui) (Optional)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.feeAmount}
                  onChange={(e) =>
                    handleInputChange("feeAmount", e.target.value)
                  }
                  onKeyDown={handleNumberKeyDown}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                  placeholder="0.0"
                />
              </div>

              {/* Assignee field - only show for sub-events */}
              {parentEventId && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Assignee (Optional)
                  </label>
                  <AssigneeSelector
                    value={formData.assignee}
                    onChange={(assignee) => handleInputChange("assignee", assignee)}
                    placeholder="Enter assignee (address, @username, or t.me/username)"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-foreground-muted">
                    Leave as "self" to manage this sub-event yourself, or assign to another user
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Min Attendees (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minAttendees}
                    onChange={(e) =>
                      handleInputChange("minAttendees", e.target.value)
                    }
                    onKeyDown={handleNumberKeyDown}
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Min Completion Rate % (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minCompletionRate}
                    onChange={(e) =>
                      handleInputChange("minCompletionRate", e.target.value)
                    }
                    onKeyDown={handleNumberKeyDown}
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Min Avg Rating (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.minAvgRating}
                    onChange={(e) =>
                      handleInputChange("minAvgRating", e.target.value)
                    }
                    onKeyDown={handleNumberKeyDown}
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base text-foreground placeholder-foreground-muted"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sponsors */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
                Event Sponsors
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Add Sponsors
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSponsor}
                    onChange={(e) => setNewSponsor(e.target.value)}
                    onKeyPress={handleSponsorKeyPress}
                    placeholder="Enter sponsor name..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button
                    onClick={addSponsor}
                    disabled={!newSponsor.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {formData.sponsors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Current Sponsors
                    </label>
                    <div className="space-y-2">
                      {formData.sponsors.map((sponsor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                        >
                          <span className="text-foreground">{sponsor}</span>
                          <Button
                            onClick={() => removeSponsor(index)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.sponsors.length === 0 && (
                  <p className="text-sm text-foreground-muted">
                    No sponsors added yet. You can add sponsors later or leave this empty.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Media */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
                Event Media
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Banner Image
                </label>
                <label
                  htmlFor="banner-upload"
                  className="block border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-card"
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageUpload(file);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {formData.bannerImage ? (
                    <div>
                      <img
                        src={formData.imageUrl || formData.previewUrl}
                        alt="Preview"
                        className="max-h-48 mx-auto mb-2 rounded"
                      />
                      <p className="text-sm text-foreground-secondary">
                        Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <Image className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-foreground-muted" />
                      <p className="text-foreground-secondary mb-2 text-sm sm:text-base">
                        Drop your banner image here or click to browse
                      </p>
                      <p className="text-xs sm:text-sm text-foreground-muted">
                        PNG, JPG up to 10MB
                      </p>
                    </>
                  )}
                </label>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                {uploadingImage && (
                  <div className="mt-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">
                Review Your Event
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Event Title
                  </h4>
                  <p className="text-sm sm:text-base text-foreground">
                    {formData.title || "Not specified"}
                  </p>
                </div>

                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Description
                  </h4>
                  <p className="text-sm sm:text-base text-foreground">
                    {formData.description || "Not specified"}
                  </p>
                </div>

                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Location
                  </h4>
                  <p className="text-sm sm:text-base text-foreground">
                    {formData.location || "Not specified"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Date
                    </h4>
                    <p className="text-sm sm:text-base text-foreground">
                      {formData.date ? formData.date.format('YYYY-MM-DD') : "Not specified"}
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Time
                    </h4>
                    <p className="text-sm sm:text-base text-foreground">
                      {formData.time ? formData.time.format('HH:mm') : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Max Attendees
                  </h4>
                  <p className="text-sm sm:text-base text-foreground">
                    {formData.maxAttendees || "Unlimited"}
                  </p>
                </div>

                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Fee Amount
                  </h4>
                  <p className="text-sm sm:text-base text-foreground">
                    {formData.feeAmount ? `${formData.feeAmount} Sui` : "Free"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Min Attendees
                    </h4>
                    <p className="text-sm sm:text-base text-foreground">
                      {formData.minAttendees || "No minimum"}
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Min Completion Rate
                    </h4>
                    <p className="text-sm sm:text-base text-foreground">
                      {formData.minCompletionRate ? `${formData.minCompletionRate}%` : "No minimum"}
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                    <h4 className="font-semibold text-primary text-sm sm:text-base">
                      Min Avg Rating
                    </h4>
                    <p className="text-sm sm:text-base text-foreground">
                      {formData.minAvgRating ? `${formData.minAvgRating}/5` : "No minimum"}
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
                  <h4 className="font-semibold text-primary text-sm sm:text-base">
                    Sponsors
                  </h4>
                  <div className="text-sm sm:text-base text-foreground">
                    {formData.sponsors.length > 0 ? (
                      <div className="space-y-1">
                        {formData.sponsors.map((sponsor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            <span>{sponsor}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-foreground-muted">No sponsors added</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add error display and loading state to the UI */}
          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                className="w-full sm:w-auto order-1 sm:order-2"
                size="lg"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto order-1 sm:order-2"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
