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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { Transaction } from "@mysten/sui/transactions";
import Card from "../components/Card";
import Button from "../components/Button";
import StatCard from "../components/StatCard";
import AirdropCreationModal from "../components/AirdropCreationModal";
// import AirdropManagement from "../components/AirdropManagement";
import ErrorModal from "../components/ErrorModal";

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
  title: string;
  date: string;
  status: "upcoming" | "active" | "completed";
  checkedIn: number;
  totalCapacity: number;
  escrowStatus: "pending" | "released" | "locked";
  rating: number;
  revenue: number;
  state: number; // Add state for activation logic
  metadata_uri?: string;
  location?: string;
}

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
  const [eventsWithNFTEnabled, setEventsWithNFTEnabled] = useState<{
    [eventId: string]: boolean;
  }>({});
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [selectedEventForAirdrop, setSelectedEventForAirdrop] =
    useState<Event | null>(null);
  const [creatingAirdrop, setCreatingAirdrop] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Airdrop validation state
  const [eventEligibleRecipients, setEventEligibleRecipients] = useState<{
    [eventId: string]: {
      checkedIn: number;
      checkedOut: number;
      totalAttendees: number;
    };
  }>({});
  const [validatingAirdrop, setValidatingAirdrop] = useState<{
    [eventId: string]: boolean;
  }>({});

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  const [errorRetryAction, setErrorRetryAction] = useState<(() => void) | null>(
    null
  );

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
    try {
      let userAddress = "";

      // Check if this is the new QR format with pass_id
      if (qrData.pass_id && qrData.pass_hash === null && qrData.user_address) {
        userAddress = qrData.user_address;

        // Use the new check-in method that generates pass hash from pass_id
        const tx = sdk.attendanceVerification.checkInAttendeeWithPassId(
          selectedEventId!,
          qrData.user_address,
          parseInt(qrData.pass_id),
          attendanceRegistryId,
          registrationRegistryId
        );

        await signAndExecute({
          transaction: tx,
        });

        alert(
          `Successfully checked in ${qrData.user_address}. PoA capability transferred.`
        );
      } else {
        // Fallback to old method for backward compatibility
        // Validate QR code
        
        const validation = await sdk.attendanceVerification.validateQRCode(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qrData as any,
          selectedEventId!
        );

        if (!validation.success) {
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

        await signAndExecute({
          transaction: tx,
        });

        alert(
          `Successfully checked in ${validation.attendeeAddress}. PoA capability transferred.`
        );
      }

      // Verify capability transfer after successful check-in
      setTimeout(async () => {
        try {
          console.log("=== VERIFYING CAPABILITY TRANSFER ===");
          console.log("User address:", userAddress);
          console.log("Event ID:", selectedEventId);

          const { data: objects } = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: {
              StructType: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::MintPoACapability`,
            },
            options: { showContent: true },
          });

          console.log(
            "Found MintPoACapability objects for user:",
            objects.length
          );

          for (const obj of objects) {
            const content = obj.data?.content;
            if (
              content &&
              content.dataType === "moveObject" &&
              "fields" in content
            ) {
              const fields = (content as { fields: { event_id?: string } }).fields;
              console.log("Capability object:", fields);
              if (fields && fields.event_id === selectedEventId) {
                console.log(
                  "✅ SUCCESS: User has MintPoACapability for this event!"
                );
                break;
              }
            }
          }
          console.log("=== CAPABILITY VERIFICATION END ===");
        } catch (error) {
          console.error("Error verifying capability:", error);
        }
      }, 3000);

      // Reload events to update attendee count
      await loadOrganizerData();
    } catch {
      alert("Failed to check in attendee. Please try again.");
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
          tx.pure.string(event.title),
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
    // Log all relevant IDs and event object for confirmation
    console.log("Selected event for completion:", {
      eventId: event.id,
      eventRegistryId,
      organizerProfileId,
      eventObject: event,
    });
    setEventToComplete(event);
    setShowCompleteModal(true);
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
      console.log("Completing event with:", {
        eventId: eventToComplete.id,
        eventRegistryId,
        organizerProfileId,
      });
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
      console.error("Error checking event community:", e);
      setEventCommunities((prev) => ({ ...prev, [eventId]: null }));
    } finally {
      setCheckingCommunities((prev) => ({ ...prev, [eventId]: false }));
    }
  }, [communityRegistryId, sdk]);

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
    setCommunityName(`${event.title} Community`);
    setCommunityDescription(
      `Join the live community for ${event.title} attendees`
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

  const handleCreateAirdrop = async (event: Event) => {
    // Check eligible recipients first
    await checkEligibleRecipients(event.id);

    const recipients = eventEligibleRecipients[event.id];

    // If no eligible recipients, show error modal instead
    if (!recipients || recipients.totalAttendees === 0) {
      setErrorMessage(
        "No eligible recipients found for this event. Ensure attendees have checked in or completed the event."
      );
      setErrorDetails(new Error("No eligible recipients"));
      setShowErrorModal(true);
      return;
    }

    setSelectedEventForAirdrop(event);
    setShowAirdropModal(true);
  };

  const checkEligibleRecipients = async (eventId: string) => {
    if (!attendanceRegistryId) return;

    setValidatingAirdrop((prev) => ({ ...prev, [eventId]: true }));

    try {
      // Query attendance stats for the event
      const tx = new Transaction();
      tx.moveCall({
        target: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::get_event_stats`,
        arguments: [tx.pure.id(eventId), tx.object(attendanceRegistryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "0x0",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 3) {
          const checkedIn = Array.isArray(returnVals[0])
            ? (returnVals[0] as unknown as number[])[0] || 0
            : parseInt(returnVals[0] as string) || 0;
          const checkedOut = Array.isArray(returnVals[1])
            ? (returnVals[1] as unknown as number[])[0] || 0
            : parseInt(returnVals[1] as string) || 0;
          const totalAttendees = checkedIn + checkedOut;

          setEventEligibleRecipients((prev) => ({
            ...prev,
            [eventId]: {
              checkedIn,
              checkedOut,
              totalAttendees,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error checking eligible recipients:", error);
      // Set default values if query fails
      setEventEligibleRecipients((prev) => ({
        ...prev,
        [eventId]: {
          checkedIn: 0,
          checkedOut: 0,
          totalAttendees: 0,
        },
      }));
    } finally {
      setValidatingAirdrop((prev) => ({ ...prev, [eventId]: false }));
    }
  };

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
        throw new Error("Insufficient SUI balance for airdrop");
      }

      const tx = sdk.airdropDistribution.createAirdrop(
        selectedEventForAirdrop.id,
        config,
        coinWithBalance.coinObjectId,
        airdropRegistryId,
        attendanceRegistryId,
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
      console.error("Failed to create airdrop:", error);
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
        navigate("/create-organizer-profile");
        return;
      }

      // Get organizer's events
      const organizerEvents = await sdk.eventManagement.getEventsByOrganizer(
        currentAccount.address,
        eventRegistryId
      );

      // Transform events to match interface
      const transformedEvents = await Promise.all(
        organizerEvents.map(async (event) => {
          // Get real attendee count
          const attendeeCount = await sdk.eventManagement.getEventAttendeeCount(
            event.id,
            eventRegistryId
          );

          return {
            id: event.id,
            title: event.name,
            date: new Date(event.start_time * 1000).toISOString().split("T")[0],
            status: (event.state === 0
              ? "upcoming"
              : event.state === 1
              ? "active"
              : "completed") as "upcoming" | "active" | "completed",
            checkedIn: attendeeCount, // Use real attendee count
            totalCapacity: 100, // TODO: Get from event data
            escrowStatus: "pending" as "pending" | "released" | "locked",
            rating: 0, // TODO: Get from event data
            revenue: 0, // TODO: Get from event data
            state: event.state, // Add state for activation logic
          };
        })
      );

      setEvents(transformedEvents);

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
    } catch {
      // Only keep error log if needed for debugging
    } finally {
      setLoading(false);
    }
  }, [currentAccount, sdk, navigate, eventRegistryId, communityRegistryId, checkEventCommunity, checkNFTMintingStatus]);

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
    (sum, event) => sum + event.checkedIn,
    0
  );
  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  const avgRating =
    events
      .filter((e) => e.rating > 0)
      .reduce((sum, event) => sum + event.rating, 0) /
    events.filter((e) => e.rating > 0).length;

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

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case "released":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "locked":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-foreground-muted";
    }
  };

  const getAirdropButtonStatus = (event: Event) => {
    const recipients = eventEligibleRecipients[event.id];
    const isValidating = validatingAirdrop[event.id];

    if (isValidating) {
      return {
        disabled: true,
        text: "Checking Recipients...",
        icon: Loader2,
        variant: "outline" as const,
        className: "opacity-50",
        tooltip: "Validating eligible recipients...",
      };
    }

    if (!recipients) {
      return {
        disabled: false,
        text: "Create Airdrop",
        icon: Gift,
        variant: "outline" as const,
        className: "",
        tooltip: "Click to check eligible recipients",
      };
    }

    if (recipients.totalAttendees === 0) {
      return {
        disabled: true,
        text: "No Recipients",
        icon: Gift,
        variant: "outline" as const,
        className: "opacity-50 cursor-not-allowed",
        tooltip: `No eligible recipients found. Checked in: ${recipients.checkedIn}, Checked out: ${recipients.checkedOut}`,
      };
    }

    return {
      disabled: false,
      text: `Create Airdrop (${recipients.totalAttendees} eligible)`,
      icon: Gift,
      variant: "outline" as const,
      className: "",
      tooltip: `${recipients.checkedIn} checked in, ${recipients.checkedOut} checked out`,
    };
  };

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
              value={`$${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="accent"
              trend={{ value: 15, isPositive: true }}
              description="Total earnings"
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
                                  {event.title}
                                </h3>
                                <p className="text-foreground-secondary text-sm">
                                  {new Date(event.date).toLocaleDateString(
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
                                    event.status
                                  )}`}
                                >
                                  {event.status.charAt(0).toUpperCase() +
                                    event.status.slice(1)}
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-foreground-secondary">
                                  Check-ins
                                </span>
                                <span className="text-sm text-foreground">
                                  {event.checkedIn} / {event.totalCapacity}
                                </span>
                              </div>
                              <div className="w-full bg-border rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      (event.checkedIn / event.totalCapacity) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-foreground-muted mt-1">
                                {Math.round(
                                  (event.checkedIn / event.totalCapacity) * 100
                                )}
                                % capacity
                              </p>
                            </div>
                          </div>

                          {/* Event Stats */}
                          <div className="flex flex-col justify-center bg-card-secondary rounded-lg p-4 h-full min-w-[180px]">
                            <div className="flex flex-row items-center justify-between gap-4 mb-2">
                              {/* Escrow Status */}
                              <div className="flex-1 text-center p-2 rounded bg-foreground-muted">
                                <div className="text-xs text-foreground-muted mb-1">
                                  Escrow
                                </div>
                                <div
                                  className={`text-sm font-medium ${getEscrowStatusColor(
                                    event.escrowStatus
                                  )}`}
                                >
                                  {event.escrowStatus.charAt(0).toUpperCase() +
                                    event.escrowStatus.slice(1)}
                                </div>
                              </div>
                              {/* Revenue */}
                              <div className="flex-1 text-center p-2 rounded bg-foreground-muted">
                                <div className="text-xs text-foreground-muted mb-1">
                                  Revenue
                                </div>
                                <div className="text-sm font-medium text-foreground">
                                  ${event.revenue.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {/* Rating */}
                            {event.rating > 0 && (
                              <div className="text-center p-2 rounded bg-foreground-muted mt-2">
                                <div className="text-xs text-foreground-muted mb-2">
                                  Rating
                                </div>
                                <RatingStars
                                  rating={event.rating}
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
                                >
                                  <QrCode className="mr-1 h-3 w-3" />
                                  Check-in
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
                                {(() => {
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
                                })()}
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
                <span className="font-bold">{eventToComplete.title}</span> as
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
            eventName={selectedEventForAirdrop.title}
            loading={creatingAirdrop}
          />
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
