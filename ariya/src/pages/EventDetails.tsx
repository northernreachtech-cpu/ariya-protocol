import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  QrCode,
  Share2,
  Trophy,
  Loader2,
  Star,
  MessageCircle,
  RefreshCw,
  DollarSign,
  CheckCircle,
  Eye,
  FileText,
} from "lucide-react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useZkLogin } from "../contexts/ZkLoginContext";
import { useAriyaSDK } from "../lib/sdk";
import type { Event as EventData, DocumentFlow, DocumentSubmission, ChainParticipant } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import Card from "../components/Card";
import Button from "../components/Button";
import QRDisplay from "../components/QRDisplay";
import useScrollToTop from "../hooks/useScrollToTop";
import DocumentFlowCard from "../components/DocumentFlowCard";
import CreateDocumentFlowModal from "../components/CreateDocumentFlowModal";
import SubmitDocumentModal from "../components/SubmitDocumentModal";
import AirdropDisplay from "../components/AirdropDisplay";
// import { useMemo } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../config/sui";
import { EscrowSettlementSDK } from "../lib/sdk";

// Skeleton loader components for EventDetails
const EventDetailsSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* About Section */}
          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="h-8 bg-skeleton rounded mb-4 w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-skeleton rounded w-full"></div>
              <div className="h-4 bg-skeleton rounded w-5/6"></div>
              <div className="h-4 bg-skeleton rounded w-4/6"></div>
            </div>
          </Card>

          {/* Organizer Section */}
          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="h-8 bg-skeleton rounded mb-4 w-1/3"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
              <div className="w-16 h-16 rounded-full bg-skeleton"></div>
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-skeleton rounded w-24 mb-2"></div>
                <div className="h-4 bg-skeleton rounded w-48"></div>
              </div>
              <div className="h-8 bg-skeleton rounded w-24"></div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Action Card */}
          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="text-center mb-6">
              <div className="h-8 bg-skeleton rounded w-16 mx-auto mb-1"></div>
              <div className="h-4 bg-skeleton rounded w-20 mx-auto"></div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="h-12 bg-skeleton rounded"></div>
              <div className="h-12 bg-skeleton rounded"></div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-20"></div>
                <div className="h-4 bg-skeleton rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-16"></div>
                <div className="h-4 bg-skeleton rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-20"></div>
                <div className="h-4 bg-skeleton rounded w-16"></div>
              </div>
            </div>
          </Card>

          {/* Event Details */}
          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="h-6 bg-skeleton rounded mb-4 w-1/2"></div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-16"></div>
                <div className="h-4 bg-skeleton rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-20"></div>
                <div className="h-4 bg-skeleton rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-16"></div>
                <div className="h-4 bg-skeleton rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-skeleton rounded w-20"></div>
                <div className="h-4 bg-skeleton rounded w-16"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// Attendance status text helper (copied from MyEvents)
const getAttendanceStatusText = (state: unknown) => {
  const stateValue = Array.isArray(state) ? state[0] : state;
  switch (stateValue) {
    case 0:
      return "Registered";
    case 1:
      return "Checked In";
    case 2:
      return "Checked Out";
    default:
      return "Unknown";
  }
};

const EventDetails = () => {
  useScrollToTop();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const sdk = useAriyaSDK();

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;
  const registrationRegistryId = useNetworkVariable("registrationRegistryId");
  const attendanceRegistryId = useNetworkVariable("attendanceRegistryId");
  const nftRegistryId = useNetworkVariable("nftRegistryId");
  const communityRegistryId = useNetworkVariable("communityRegistryId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const platformTreasuryId = useNetworkVariable("platformTreasuryId");
  const subscriptionRegistryId = useNetworkVariable("subscriptionRegistryId");
  const documentFlowRegistryId = useNetworkVariable("documentFlowRegistryId");
  const airdropRegistryId = useNetworkVariable("airdropRegistryId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Attendance state from navigation (if available)
  const navAttendanceState = location.state?.attendanceState;
  const navHasRecord = location.state?.hasRecord;
  const navCheckInTime = location.state?.checkInTime;
  const navCheckOutTime = location.state?.checkOutTime;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState("");
  const [attendanceState, setAttendanceState] = useState(
    navAttendanceState ?? null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hasRecord, setHasRecord] = useState(navHasRecord ?? null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_checkInTime, setCheckInTime] = useState(navCheckInTime ?? null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_checkOutTime, setCheckOutTime] = useState(navCheckOutTime ?? null);
  const [hasMintedNFT, setHasMintedNFT] = useState(false); // Placeholder, should check actual mint status
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventLink, setShareEventLink] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<unknown>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorAmount, setSponsorAmount] = useState(0);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState("");
  const [sponsorSuccess, setSponsorSuccess] = useState("");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");
  const clockId = "0x6";
  const [escrowSDK, setEscrowSDK] = useState<EscrowSettlementSDK | null>(null);
  const [joiningCommunity, setJoiningCommunity] = useState(false);
  const [mintingPoA, setMintingPoA] = useState(false);
  const [hasPoACapability, setHasPoACapability] = useState(false);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [subEvents, setSubEvents] = useState<EventData[]>([]);
  const [subEventsLoading, setSubEventsLoading] = useState(false);

  // Document flow state
  const [showDocFlowModal, setShowDocFlowModal] = useState(false);
  const [documentFlowData, setDocumentFlowData] = useState<{
    flow: DocumentFlow | null;
    submissions: DocumentSubmission[];
  }>({ flow: null, submissions: [] });
  const [documentFlowLoading, setDocumentFlowLoading] = useState(false);
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const [showSubmitDocumentModal, setShowSubmitDocumentModal] = useState(false);

  useEffect(() => {
    setEscrowSDK(new EscrowSettlementSDK(sdk.eventManagement.getPackageId()));
  }, [sdk]);

  // Helper to fetch organizer profile by address
  const fetchOrganizerProfile = async (organizerAddress: string) => {
    setProfileLoading(true);
    setProfileError("");
    setOrganizerProfile(null);
    try {
      const allProfiles = await sdk.eventManagement.getAllOrganizers();
      const normalize = (addr: string) => {
        if (!addr) return "";
        return addr.toLowerCase().startsWith("0x")
          ? addr.toLowerCase()
          : `0x${addr.toLowerCase()}`;
      };
      const profile = allProfiles.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => normalize(p.address) === normalize(organizerAddress)
      );
      if (profile) {
        setOrganizerProfile(profile);
      } else {
        setProfileError("Organizer profile not found.");
      }
    } catch {
      setProfileError("Failed to load organizer profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Load sub-events for this event
  const loadSubEvents = useCallback(async (eventId?: string) => {
    const targetEventId = eventId || event?.id;
    if (!targetEventId) return;
    
    setSubEventsLoading(true);
    try {
      const childEvents = await sdk.eventManagement.getChildEventsForParent(targetEventId);
      setSubEvents(childEvents);
    } catch (error) {
      setSubEvents([]);
    } finally {
      setSubEventsLoading(false);
    }
  }, [event, sdk]);

  const checkCommunityMembership = useCallback(async () => {
    if (!activeAddress || !isAuthenticated || !event || !communityRegistryId || !nftRegistryId) {
      return;
    }

    try {
      // First, get communities for this event
      const communities = await sdk.communityAccess.getEventCommunities(
        event.id,
        communityRegistryId
      );

      if (communities.length === 0) {
        setIsCommunityMember(false);
        setCommunityId(null);
        return;
      }

      // For now, check the first community
      const community = communities[0];
      setCommunityId(community.id);

      // Check if user is already an active member
      const membershipCheck = await sdk.communityAccess.isActiveCommunityMember(
        community.id,
        activeAddress,
        communityRegistryId,
        nftRegistryId
      );

      setIsCommunityMember(membershipCheck.isActive);
    } catch (error) {
      setIsCommunityMember(false);
      setCommunityId(null);
    }
  }, [activeAddress, isAuthenticated, event, communityRegistryId, nftRegistryId, sdk]);

  const checkPoACapability = useCallback(async () => {
    if (!activeAddress || !isAuthenticated || !event) {
      return;
    }

    try {
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: activeAddress,
        filter: {
          StructType: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::MintPoACapability`,
        },
        options: { showContent: true },
      });

      // Check if user has a MintPoACapability for this specific event
      let hasCapability = false;
      for (const obj of objects) {
        const content = obj.data?.content;

        if (
          content &&
          content.dataType === "moveObject" &&
          "fields" in content
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fields = (content as any).fields;

          if (fields && fields.event_id === event.id) {
            hasCapability = true;
            break;
          }
        }
      }

      setHasPoACapability(hasCapability);
    } catch (error) {
      setHasPoACapability(false);
    }
  }, [activeAddress, isAuthenticated, event, sdk]);

  const refreshEventData = useCallback(async () => {
    if (activeAddress && isAuthenticated && event) {
      // Reset states
      setHasPoACapability(false);
      setIsCommunityMember(false);
      setCommunityId(null);

      // Re-check PoA capability
      await checkPoACapability();

      // Re-check community membership
      setTimeout(() => {
        checkCommunityMembership();
      }, 1000);

      // Re-load sub-events if this is a parent event
      if (!event.is_child) {
        await loadSubEvents(event.id);
      }
    }
  }, [activeAddress, isAuthenticated, event, checkPoACapability, checkCommunityMembership, loadSubEvents]);

  const handleMintPoA = async () => {
    if (!activeAddress || !isAuthenticated || !nftRegistryId || !event) return;
    setMintingPoA(true);
    try {
      await sdk.attendanceVerification.mintPoANFT(
        activeAddress,
        event.id,
        nftRegistryId,
        signAndExecute
      );
      setMintResult({
        success: true,
        message: "PoA NFT minted successfully! You can now join the community.",
      });
      // Refresh capability status to hide the mint button
      await checkPoACapability();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setMintResult({
        success: false,
        message: e.message || "Failed to mint PoA NFT. Please try again.",
      });
    } finally {
      setMintingPoA(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!activeAddress || !isAuthenticated || !event || !communityRegistryId || !nftRegistryId)
      return;
    setJoiningCommunity(true);
    try {
      // First check if user has PoA NFT for this event
      const hasPoA = await sdk.attendanceVerification.hasPoANFT(
        activeAddress,
        event.id,
        nftRegistryId
      );

      // Check for both PoA and Completion NFTs
      const hasCompletion = await sdk.attendanceVerification.hasCompletionNFT(
        activeAddress,
        event.id,
        nftRegistryId
      );

      if (!hasPoA && !hasCompletion) {
        setMintResult({
          success: false,
          message:
            "You need either a PoA NFT or Completion NFT to join the community. Please mint your PoA NFT first, or if you've checked out, mint your Completion NFT.",
        });
        return;
      }

      // Check if there are communities for this event
      const communities = await sdk.communityAccess.getEventCommunities(
        event.id,
        communityRegistryId
      );

      if (communities.length === 0) {
        setMintResult({
          success: false,
          message:
            "No community available for this event yet. The organizer may create one during the event.",
        });
        return;
      }

      // For now, join the first community
      const communityId = communities[0].id;

      // Check if user is already an active member
      const membershipCheck = await sdk.communityAccess.isActiveCommunityMember(
        communityId,
        activeAddress,
        communityRegistryId,
        nftRegistryId
      );

      if (membershipCheck.isActive) {
        // User is already an active member, navigate directly to community
        setMintResult({
          success: true,
          message:
            "You're already a member of this community! Redirecting you now.",
        });
        setTimeout(() => {
          navigate(`/community/${communityId}`);
        }, 1500);
        return;
      }

      // User needs to join or rejoin the community
      const tx = sdk.communityAccess.requestCommunityAccess(
        communityId,
        activeAddress,
        nftRegistryId,
        communityRegistryId
      );

      await signAndExecute({ transaction: tx });
      setMintResult({
        success: true,
        message:
          "Successfully joined the event community! You can now access forums and resources.",
      });

      // Refresh community membership status
      setTimeout(() => {
        checkCommunityMembership();
      }, 2000);

      // Navigate to community after a short delay
      setTimeout(() => {
        navigate(`/community/${communityId}`);
      }, 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let message = e.message || "Failed to join community.";

      // Handle specific Move abort codes
      if (message.includes("MoveAbort") && message.includes("4")) {
        message =
          "You need either a PoA (Proof of Attendance) NFT or Completion NFT to join this community. If you've checked in, mint your PoA NFT. If you've checked out, mint your Completion NFT.";
      } else if (message.includes("MoveAbort") && message.includes("2")) {
        message = "Community not found or inactive.";
      } else if (message.includes("MoveAbort") && message.includes("3")) {
        message = "You're already a member of this community.";
      } else if (message.includes("NFT required")) {
        message =
          "You need either a PoA NFT or Completion NFT to join this community. Make sure you've minted the appropriate NFT.";
      }

      setMintResult({
        success: false,
        message,
      });
    } finally {
      setJoiningCommunity(false);
    }
  };

  // Document flow functions
  const loadDocumentFlowData = useCallback(async (eventId: string) => {
    if (!eventId) return;
    
    setDocumentFlowLoading(true);
    try {
      const [flow, submissions] = await Promise.all([
        sdk.documentFlow.getDocumentFlow(eventId),
        sdk.documentFlow.getDocumentSubmissions(eventId)
      ]);
      
      setDocumentFlowData({ flow, submissions });
    } catch (error) {
      setDocumentFlowData({ flow: null, submissions: [] });
    } finally {
      setDocumentFlowLoading(false);
    }
  }, [sdk]);

  const handleOpenDocFlow = useCallback(() => {
    if (!event) return;
    
    setShowDocFlowModal(true);
    if (!documentFlowData.flow) {
      loadDocumentFlowData(event.id);
    }
  }, [event, documentFlowData.flow, loadDocumentFlowData]);

  const handleCreateDocumentFlow = async (participants: ChainParticipant[]) => {
    if (!event || !activeAddress || !isAuthenticated || !documentFlowRegistryId || !profileRegistryId) return;
    
    setDocumentFlowLoading(true);
    try {
      const tx = sdk.documentFlow.createDocumentFlow(
        event.id,
        participants,
        clockId,
        documentFlowRegistryId,
        profileRegistryId
      );
      
      await signAndExecute({ transaction: tx });
      
      // Reload document flow data
      await loadDocumentFlowData(event.id);
      setShowCreateFlowModal(false);
    } catch (error) {
      console.error('Failed to create document flow:', error);
    } finally {
      setDocumentFlowLoading(false);
    }
  };

  const handleSubmitDocument = async (documentData: {
    title: string;
    description: string;
    documentUri: string;
    documentType: string;
  }) => {
    if (!event || !activeAddress || !isAuthenticated || !documentFlowData.flow || !documentFlowRegistryId || !profileRegistryId) return;
    
    try {
      const tx = sdk.documentFlow.submitDocument(
        documentFlowData.flow.id,
        event.id,
        documentData.title,
        documentData.description,
        documentData.documentUri,
        documentData.documentType,
        clockId,
        documentFlowRegistryId,
        profileRegistryId
      );
      
      await signAndExecute({ transaction: tx });
      
      // Reload document flow data
      await loadDocumentFlowData(event.id);
      setShowSubmitDocumentModal(false);
    } catch (error) {
      console.error('Failed to submit document:', error);
    }
  };

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        return;
      }

      // Small delay to ensure wallet connection is fully established
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        setLoading(true);
        const eventData = await sdk.eventManagement.getEvent(id);
        
        if (eventData) {
          setEvent(eventData);
        } else {
          setEvent(eventData);
        }

        // Check if user is registered and if user is organizer
        if (activeAddress && eventData && isAuthenticated) {
          const [isUserRegistered, organizerCheck] = await Promise.all([
            sdk.identityAccess.isRegistered(
              id,
              activeAddress,
              registrationRegistryId
            ),
            sdk.identityAccess.isEventOrganizer(id, activeAddress),
          ]);

          setIsRegistered(isUserRegistered);
          setIsOrganizer(organizerCheck);
        }

        // Load sub-events if this is a parent event
        if (eventData && !eventData.is_child) {
          await loadSubEvents(eventData.id);
        }

        // Fetch attendance state for all users with wallets (not just registered users)
        if (
          activeAddress &&
          isAuthenticated &&
          (navAttendanceState === null || navAttendanceState === undefined)
        ) {

          
          try {
            const tx = new Transaction();
            tx.moveCall({
              target: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::get_attendance_status`,
              arguments: [
                tx.pure.address(activeAddress),
                tx.pure.id(id),
                tx.object(attendanceRegistryId),
              ],
            });
            const result = await suiClient.devInspectTransactionBlock({
              transactionBlock: tx,
              sender: activeAddress,
            });
            
            if (result && result.results && result.results.length > 0) {
              const returnVals = result.results[0].returnValues;
              
              if (Array.isArray(returnVals) && returnVals.length >= 4) {
                const hasRecord = Array.isArray(returnVals[0])
                  ? returnVals[0].length > 0
                  : !!returnVals[0];
                  
                const attendanceState = Array.isArray(returnVals[1])
                  ? returnVals[1][0]
                  : parseInt(returnVals[1]) || 0;
                  
                const checkInTime = Array.isArray(returnVals[2])
                  ? returnVals[2][0]
                  : parseInt(returnVals[2]) || 0;
                  
                const checkOutTime = Array.isArray(returnVals[3])
                  ? returnVals[3][0]
                  : parseInt(returnVals[3]) || 0;
                
                setHasRecord(hasRecord);
                setAttendanceState(attendanceState);
                setCheckInTime(checkInTime);
                setCheckOutTime(checkOutTime);
                
                console.log("🔍 Attendance State - Set from blockchain:", {
                  hasRecord,
                  attendanceState,
                  checkInTime,
                  checkOutTime,
                  attendanceStateText: getAttendanceStatusText(attendanceState)
                });
              }
            }
          } catch {
            setAttendanceState(0);
            setHasRecord(false);
            setCheckInTime(0);
            setCheckOutTime(0);
          }

          // Check PoA capability for checked-in users
          if (attendanceState === 1) {
            checkPoACapability();

            // Also check community membership after PoA capability check
            setTimeout(() => {
              checkCommunityMembership();
            }, 1000);
          }

          // Also check if we have navigation state and user is checked in
          if (
            navAttendanceState &&
            Array.isArray(navAttendanceState) &&
            navAttendanceState[0] === 1
          ) {
            checkPoACapability();
          }
        } else {
          // Set attendance state from navigation
          if (Array.isArray(navAttendanceState)) {
            setAttendanceState(navAttendanceState[0]);
            
            console.log("🔍 Attendance State - Set from navigation:", {
              attendanceState: navAttendanceState[0],
              attendanceStateText: getAttendanceStatusText(navAttendanceState[0])
            });

            // Check PoA capability for checked-in users
            if (navAttendanceState[0] === 1) {
              checkPoACapability();

              // Also check community membership after PoA capability check
              setTimeout(() => {
                checkCommunityMembership();
              }, 1000);
            }
          }
        }
      } catch (error) {
        // Error loading event
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    activeAddress,
    isAuthenticated,
    sdk,
    registrationRegistryId,
    attendanceRegistryId,
    nftRegistryId,
    communityRegistryId,
  ]);

  // Refresh data when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      refreshEventData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeAddress, isAuthenticated, event, refreshEventData]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusText = (state: number) => {
    switch (state) {
      case 0:
        return "Created";
      case 1:
        return "Active";
      case 2:
        return "Completed";
      case 3:
        return "Settled";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (state: number) => {
    switch (state) {
      case 0:
        return "bg-yellow-500/20 text-yellow-400";
      case 1:
        return "bg-green-500/20 text-green-400";
      case 2:
        return "bg-blue-500/20 text-blue-400";
      case 3:
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleRegister = async () => {
    if (!activeAddress || !event || !isAuthenticated) return;

    try {
      setRegistering(true);

      // Fetch organizer subscription and profile data
      let organizerSubscriptionId: string | null = null;
      let organizerProfileId: string | null = null;

      try {
        // Get organizer subscription ID
        organizerSubscriptionId = await sdk.subscription.getUserSubscriptionId(
          subscriptionRegistryId,
          event.organizer
        );

        // Get organizer profile ID by querying OrganizerCap objects
        const { data: objects } = await suiClient.getOwnedObjects({
          owner: event.organizer,
          filter: {
            StructType: `${sdk.eventManagement.getPackageId()}::event_management::OrganizerCap`,
          },
          options: { showContent: true },
        });
        
        for (const obj of objects) {
          if (obj.data?.content?.dataType === "moveObject") {
            const fields = obj.data.content.fields;
            const fieldsTyped = fields as { profile_id?: string };
            const profileId = typeof fieldsTyped.profile_id === "string"
              ? fieldsTyped.profile_id
              : undefined;
            if (profileId) {
              organizerProfileId = profileId;
              break;
            }
          }
        }
      } catch (error) {
        // If we can't fetch organizer data, we'll use fallback values
        organizerSubscriptionId = null;
        organizerProfileId = null;
      }

      // Use actual event fee amount from the event data
      const eventFeeAmount = event.fee_amount || 0;
      // For paid events, check if user has sufficient balance
      if (eventFeeAmount > 0) {
        // Get user's SUI coins to check balance
        const { data: coins } = await suiClient.getCoins({
          owner: activeAddress,
          coinType: "0x2::sui::SUI",
        });

        // Calculate total balance
        const totalBalance = coins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
        const totalBalanceInSui = Number(totalBalance) / 1000000000;
        const feeInSui = eventFeeAmount / 1000000000;
        
        // Check if user has sufficient balance (including gas buffer)
        const gasBuffer = 0.1; // 0.1 SUI buffer for gas
        const totalRequired = feeInSui + gasBuffer;
        
        if (totalBalanceInSui < totalRequired) {
          console.error("❌ Insufficient balance for event registration:", {
            requiredFee: feeInSui,
            gasBuffer: gasBuffer,
            totalRequired: totalRequired,
            totalBalance: totalBalanceInSui,
            availableCoins: coins.length
          });
          
          alert(`Insufficient SUI balance for event registration.\nRequired: ${totalRequired.toFixed(6)} SUI (${feeInSui.toFixed(6)} SUI fee + ${gasBuffer} SUI gas buffer)\nAvailable: ${totalBalanceInSui.toFixed(6)} SUI`);
          return;
        }
      }

      console.log("🚀 Starting event registration with params:", {
        eventId: event.id,
        registrationRegistryId,
        organizerSubscriptionId: organizerSubscriptionId || "0x0",
        organizerProfileId: organizerProfileId || "0x0", 
        platformTreasuryId,
        userAddress: activeAddress,
        eventFeeAmount,
        organizerAddress: event.organizer
      });
      
      // Debug: Check authentication status
      console.log("🔐 Authentication debug:", {
        currentAccount: currentAccount?.address,
        zkAddress,
        activeAddress,
        isAuthenticated,
        hasCurrentAccount: !!currentAccount,
        hasZkAddress: !!zkAddress
      });

      // Use the new contract-compliant registration function
      const result = await sdk.identityAccess.registerForEventAndGenerateQR(
        event.id,
        registrationRegistryId,
        organizerSubscriptionId || "0x0", // Use fallback if not found
        organizerProfileId || "0x0", // Use fallback if not found
        platformTreasuryId,
        activeAddress,
        signAndExecute,
        eventFeeAmount
      );

      console.log("📋 Registration result:", result);

      if (result) {
        // Generate QR code string for display
        const qrDataString = JSON.stringify(result.qrData);
        setQrData(qrDataString);
        setShowQR(true);
        setIsRegistered(true);
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error: unknown) {
      // Log the full error for debugging
      console.error("❌ Registration error details:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Show user-friendly error message
      let errorMessage = "Registration failed";
      const errorObj = error as { message?: string };
      if (errorObj.message?.includes("MoveAbort")) {
        if (errorObj.message.includes(", 1)")) {
          errorMessage =
            "Event is not active for registration or you're already registered";
        } else if (errorObj.message.includes(", 2)")) {
          errorMessage = "Event capacity is full";
        } else if (errorObj.message.includes(", 3)")) {
          errorMessage = "Event not found";
        } else if (errorObj.message.includes(", 4)")) {
          errorMessage = "Insufficient payment for event registration";
        } else if (errorObj.message.includes(", 5)")) {
          errorMessage = "Organizer subscription limit exceeded";
        }
      }
      alert(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleShowQR = async () => {
    if (!activeAddress || !event || !isAuthenticated) return;

    try {
      // First verify user is registered using contract-based check
      const isUserRegistered = await sdk.identityAccess.isRegistered(
        event.id,
        activeAddress,
        registrationRegistryId
      );

      if (!isUserRegistered) {
        alert("You must be registered for this event to show QR code.");
        return;
      }

      // Try to get registration details (fallback to transaction history for pass_hash)
      const registration = await sdk.identityAccess.getRegistrationStatus(
        event.id,
        activeAddress,
        registrationRegistryId
      );

      if (registration) {
        const qrDataString = sdk.identityAccess.generateQRCodeData(
          event.id,
          activeAddress,
          registration
        );
        setQrData(qrDataString);
        setShowQR(true);
      } else {
        alert("You are registered but QR code details are not available yet. Please try again in a moment.");
      }
    } catch (error) {
      console.error("❌ Error generating QR code:", error);
      alert("Error generating QR code. Please try again.");
    }
  };

  // Helper to check if user already has completion NFT for this event
  const checkHasCompletionNFT = async () => {
    if (!activeAddress || !isAuthenticated || !event || !nftRegistryId) return false;
    try {
      // Call the Move view to check NFT ownership
      const tx = new Transaction();
      tx.moveCall({
        target: `${sdk.attendanceVerification.getPackageId()}::nft_minting::has_completion_nft`,
        arguments: [
          tx.pure.address(activeAddress),
          tx.pure.id(event.id),
          tx.object(nftRegistryId),
        ],
      });
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: activeAddress,
      });
      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (!Array.isArray(returnVals)) return false;
        let val = returnVals[0];
        // Only unwrap if val is a non-empty array and its first element is a primitive
        while (
          Array.isArray(val) &&
          val.length > 0 &&
          (typeof val[0] === "number" || typeof val[0] === "boolean")
        ) {
          val = val[0];
        }
        return (
          (typeof val === "number" || typeof val === "boolean") &&
          (val === true || val === 1)
        );
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleClaimAirdrop = async (airdropId: string) => {
    if (!activeAddress || !airdropRegistryId || !attendanceRegistryId || !nftRegistryId) {
      return;
    }

    try {
      const ratingRegistryId = useNetworkVariable("ratingRegistryId");
      const tx = sdk.airdropDistribution.claimAirdrop(
        airdropId,
        airdropRegistryId,
        attendanceRegistryId,
        nftRegistryId,
        ratingRegistryId,
        "0x6" // CLOCK_ID
      );

      await signAndExecute({ transaction: tx });

      setMintResult({
        success: true,
        message: "Airdrop claimed successfully!",
      });
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      setMintResult({
        success: false,
        message: "Failed to claim airdrop. Please try again.",
      });
    }
  };

  const handleMintCompletionNFT = async () => {
    if (!activeAddress || !isAuthenticated || !event || !nftRegistryId) return;
    setMinting(true);
    setMintResult(null);
    try {
      // Check if already minted
      if (await checkHasCompletionNFT()) {
        setMintResult({
          success: false,
          message: "You have already minted this Completion NFT.",
        });
        setHasMintedNFT(true);
        setMinting(false);
        return;
      }
      await sdk.attendanceVerification.mintCompletionNFT(
        activeAddress,
        event.id,
        nftRegistryId,
        signAndExecute
      );
      setMintResult({
        success: true,
        message: "Completion NFT minted successfully!",
      });
      setHasMintedNFT(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Show a friendlier error for EInvalidCapability
      if (e.message && e.message.includes("EInvalidCapability")) {
        setMintResult({
          success: false,
          message:
            "Mint failed: Event metadata is not set or your capability is invalid/used. Please contact the organizer or refresh your page.",
        });
      } else {
        setMintResult({
          success: false,
          message: e.message || "Minting failed",
        });
      }
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Event not found
            </h2>
            <p className="text-foreground-secondary">
              The event you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Absolutely positioned back button above hero section */}
      <div className="container mx-auto px-4 pt-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-base font-semibold bg-gradient-to-r from-primary to-secondary text-white px-5 py-2 rounded-full shadow-lg border border-primary/60 hover:from-secondary hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 mb-4 w-fit"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>
      </div>
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-background/30 z-10" />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-foreground">
            <div className="flex items-center mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  event.state
                )}`}
              >
                {getStatusText(event.state)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-4xl md:text-6xl font-livvic font-bold">
                {event?.name || "Event Details"}
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEventData}
                disabled={loading}
                className="ml-4"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-foreground-secondary">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                <span>
                  {formatDate(event.start_time)} at{" "}
                  {formatTime(event.start_time)}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                <span>
                  {event.current_attendees}/{event.capacity} attendees
                </span>
              </div>
              <div className="flex items-center">
                {event.fee_amount > 0 ? (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    <span className="text-amber-500 font-semibold">
                      ${(event.fee_amount / 1000000000).toFixed(3)} SUI
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span className="text-green-500 font-semibold">Free Event</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* About Section */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                About This Event
              </h2>
              <p className="text-foreground-secondary leading-relaxed">
                {event.description}
              </p>
            </Card>

            {/* Organizer Section */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Event Organizer
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-lg mr-0 sm:mr-4">
                  {event.organizer.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-foreground">
                    Organizer
                  </h3>
                  <p className="text-foreground-secondary text-sm break-all whitespace-pre-line">
                    {event.organizer}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 sm:mt-0"
                  onClick={() => {
                    fetchOrganizerProfile(event.organizer);
                    setShowProfileModal(true);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Sub-Events Section */}
            {!event.is_child && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Sub-Events
                </h2>
                {subEventsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-foreground-muted" />
                    <p className="text-foreground-secondary">Loading sub-events...</p>
                  </div>
                ) : subEvents.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-foreground-secondary mb-4">
                      This event includes the following sub-events. You can register for each one individually.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subEvents.map((subEvent) => (
                        <div
                          key={subEvent.id}
                          className="bg-card-secondary rounded-lg border border-border p-4 hover:bg-card transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                              {subEvent.name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                                subEvent.state === 0
                                  ? "bg-yellow-500/20 text-yellow-600"
                                  : subEvent.state === 1
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-blue-500/20 text-blue-600"
                              }`}
                            >
                              {subEvent.state === 0 ? "Upcoming" : subEvent.state === 1 ? "Active" : "Completed"}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-foreground-secondary mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(subEvent.start_time).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{subEvent.current_attendees}/{subEvent.capacity} attendees</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="truncate">{subEvent.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/event/${subEvent.id}`)}
                              className="flex-1"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View Details
                            </Button>
                            {subEvent.state === 1 && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/event/${subEvent.id}`)}
                                className="flex-1"
                              >
                                <Users className="mr-1 h-3 w-3" />
                                Register
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-secondary">
                    <p>No sub-events available for this event.</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Action Card */}
            <Card className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-1">
                  {event.current_attendees}
                </div>
                <div className="text-foreground-secondary">attending</div>
                {attendanceState !== null && (
                  <div className="mt-2">
                    {(() => {
                      const currentState = Array.isArray(attendanceState) ? attendanceState[0] : attendanceState;
                      console.log("🔍 Attendance State - Current UI state:", {
                        attendanceState,
                        currentState,
                        stateText: getAttendanceStatusText(attendanceState)
                      });
                      
                      return (
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm ${
                            currentState === 0
                              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300"
                              : currentState === 1
                              ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-emerald-300"
                              : currentState === 2
                              ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-300"
                              : "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-300"
                          }`}
                        >
                          {getAttendanceStatusText(attendanceState)}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {!isAuthenticated ? (
                  <Button size="lg" className="w-full" disabled>
                    <Users className="mr-2 h-5 w-5" />
                    Connect Wallet to Register
                  </Button>
                ) : isOrganizer ? (
                  <Button size="lg" className="w-full" disabled>
                    <Users className="mr-2 h-5 w-5" />
                    You're the Organizer
                  </Button>
                ) : event.state !== 1 ? (
                  <Button size="lg" className="w-full" disabled>
                    <Users className="mr-2 h-5 w-5" />
                    Event Not Active
                  </Button>
                ) : !isRegistered ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-5 w-5" />
                        Join Event
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {(attendanceState === 0 ||
                      attendanceState === 1 ||
                      (Array.isArray(attendanceState) &&
                        (attendanceState[0] === 0 ||
                          attendanceState[0] === 1))) && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleShowQR}
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        Show QR Code
                      </Button>
                    )}

                    {(attendanceState === 1 ||
                      (Array.isArray(attendanceState) &&
                        attendanceState[0] === 1)) &&
                      hasPoACapability && (
                        <Button
                          size="lg"
                          className="w-full mb-2"
                          variant="outline"
                          onClick={handleMintPoA}
                          disabled={mintingPoA}
                        >
                          <Trophy className="mr-2 h-5 w-5" />
                          {mintingPoA ? "Minting..." : "Mint PoA NFT"}
                        </Button>
                      )}
                    {(attendanceState === 1 ||
                      (Array.isArray(attendanceState) &&
                        attendanceState[0] === 1)) && (
                      <Button
                        size="lg"
                        className="w-full"
                        variant={isCommunityMember ? "outline" : "secondary"}
                        onClick={
                          isCommunityMember
                            ? () => navigate(`/community/${communityId}`)
                            : handleJoinCommunity
                        }
                        disabled={joiningCommunity}
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        {joiningCommunity
                          ? "Joining..."
                          : isCommunityMember
                          ? "Open Community"
                          : "Join Live Community"}
                      </Button>
                    )}
                    {(attendanceState === 2 ||
                      (Array.isArray(attendanceState) &&
                        attendanceState[0] === 2)) &&
                      !hasMintedNFT && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={handleMintCompletionNFT}
                          disabled={minting}
                        >
                          <Trophy className="h-5 w-5" />
                          {minting ? "Minting..." : "Mint Completion NFT"}
                        </Button>
                      )}
                    <div className="text-center text-sm text-green-400">
                      ✓ You're registered for this event
                    </div>
                  </div>
                )}

                {/* Sponsor this Event Button */}
                {!isOrganizer && event.state === 1 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-livvic"
                    onClick={() => setShowSponsorModal(true)}
                  >
                    Sponsor this Event
                  </Button>
                )}

                {/* Document Flow Button - Only for organizers and assignees */}
                {(isOrganizer || (event.assignee && event.assignee === activeAddress)) && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleOpenDocFlow}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Document Flow
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShareEventLink(
                      window.location.origin + "/event/" + event.id
                    );
                    setShowShareModal(true);
                  }}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share Event
                </Button>
              </div>

              {/* Event Stats */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Event State</span>
                  <span className="font-medium text-foreground">
                    {getStatusText(event.state)}
                  </span>
                </div>
                {isOrganizer && (
                  <div className="text-center text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
                    You're the organizer of this event
                  </div>
                )}
                {!isOrganizer && event.state !== 1 && (
                  <div className="text-center text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
                    Registration opens when event is activated
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDate(event.created_at)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">End Time</span>
                  <span className="font-medium text-foreground">
                    {formatDate(event.end_time)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Event Details */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Event Details
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-foreground-secondary text-sm mb-1">
                    Date & Time
                  </div>
                  <div className="font-medium text-foreground">
                    {formatDate(event.start_time)}
                    <br />
                    {formatTime(event.start_time)}
                  </div>
                </div>

                <div>
                  <div className="text-foreground-secondary text-sm mb-1">
                    Location
                  </div>
                  <div className="font-medium text-foreground">
                    {event.location}
                  </div>
                </div>

                <div>
                  <div className="text-foreground-secondary text-sm mb-1">
                    Capacity
                  </div>
                  <div className="font-medium text-foreground">
                    {event.current_attendees} / {event.capacity} people
                  </div>
                </div>
              </div>
            </Card>

            {/* Airdrop Section */}
            {event && airdropRegistryId && (
              <Card className="p-4 sm:p-6">
                <AirdropDisplay
                  eventId={event.id}
                  userAddress={activeAddress || undefined}
                  onClaim={handleClaimAirdrop}
                />
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && event && (
        <QRDisplay
          qrData={qrData}
          eventName={event.name}
          isOpen={showQR}
          onClose={() => setShowQR(false)}
        />
      )}
      {/* Mint result modal */}
      {mintResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-8 max-w-sm mx-4 shadow-lg text-center">
            <h3
              className={`text-xl font-semibold mb-4 ${
                mintResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {mintResult.success ? "Success" : "Error"}
            </h3>
            <p className="text-foreground mb-6">{mintResult.message}</p>
            <Button onClick={() => setMintResult(null)} className="w-full">
              Close
            </Button>
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
      {/* Organizer Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-card/80 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl max-w-md w-full mx-4 p-0 overflow-hidden animate-slide-up">
            <div className="flex flex-col items-center justify-center pt-8 pb-2 bg-gradient-to-r from-primary/80 to-secondary/80">
              <span className="text-5xl mb-2">👤</span>
              <h3 className="text-2xl font-bold text-white drop-shadow mb-1">
                Organizer Profile
              </h3>
            </div>
            <div className="px-8 py-6 flex flex-col gap-4">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <span className="text-foreground-secondary">
                    Loading profile...
                  </span>
                </div>
              ) : profileError ? (
                <div className="text-red-500 text-center">{profileError}</div>
              ) : organizerProfile ? (
                <>
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl mb-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(organizerProfile as any).name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="text-xl font-semibold text-primary mb-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(organizerProfile as any).name || "Unnamed Organizer"}
                    </div>
                    <div className="text-xs text-foreground-secondary break-all mb-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(organizerProfile as any).address}
                    </div>
                  </div>
                  <div className="mb-2 text-foreground-secondary text-sm whitespace-pre-line">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(organizerProfile as any).bio}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center text-xs text-foreground-secondary mb-2">
                    <div>
                      <span className="font-bold text-primary">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(organizerProfile as any).total_events}
                      </span>{" "}
                      events
                    </div>
                    <div>
                      <span className="font-bold text-primary">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(organizerProfile as any).successful_events}
                      </span>{" "}
                      successful
                    </div>
                    <div>
                      <span className="font-bold text-primary">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(organizerProfile as any).total_attendees_served}
                      </span>{" "}
                      attendees
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-foreground-secondary font-semibold">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {((organizerProfile as any).avg_rating / 100).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="text-xs text-foreground-muted text-center mb-2">
                    Profile created:{" "}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {new Date((organizerProfile as any).created_at).toLocaleDateString()}
                  </div>
                </>
              ) : null}
              <Button
                variant="outline"
                onClick={() => setShowProfileModal(false)}
                className="w-full mt-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-card/80 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl max-w-md w-full mx-4 p-0 overflow-hidden animate-slide-up">
            <div className="flex flex-col items-center justify-center pt-8 pb-2 bg-gradient-to-r from-primary/80 to-secondary/80">
              <span className="text-5xl mb-2">💸</span>
              <h3 className="text-2xl font-bold text-white drop-shadow mb-1 font-livvic">
                Sponsor this Event
              </h3>
              <p className="text-white/80 text-sm font-open-sans mb-2">
                Fund this event and help it succeed! Your funds are escrowed and
                only released if all sponsor conditions are met.
              </p>
            </div>
            <div className="px-8 py-6 flex flex-col gap-4 font-open-sans">
              <label className="text-foreground-secondary text-sm font-semibold mb-1 font-livvic">
                Sponsorship Amount (SUI)
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground font-semibold text-lg focus:ring-2 focus:ring-primary/40 outline-none"
                value={sponsorAmount}
                onChange={(e) => setSponsorAmount(Number(e.target.value))}
                disabled={sponsorLoading}
              />
              {sponsorError && (
                <div className="text-red-500 text-sm mb-2">{sponsorError}</div>
              )}
              {sponsorSuccess && (
                <div className="text-green-500 text-sm mb-2">
                  {sponsorSuccess}
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button
                  onClick={async () => {
                    setSponsorLoading(true);
                    setSponsorError("");
                    setSponsorSuccess("");
                    try {
                      if (
                        !activeAddress ||
                        !isAuthenticated ||
                        !escrowSDK ||
                        !escrowRegistryId ||
                        !event
                      )
                        throw new Error("Missing data");
                      if (sponsorAmount <= 0)
                        throw new Error("Enter a valid amount");
                      // Find a SUI coin object in the user's wallet with enough balance
                      const { data: coins } = await suiClient.getCoins({
                        owner: activeAddress,
                        coinType: "0x2::sui::SUI",
                      });
                      const coin = coins.find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (c: any) => Number(c.balance) >= sponsorAmount * 1e9
                      );
                      if (!coin)
                        throw new Error(
                          "No SUI coin with enough balance found"
                        );
                      // Build and execute the transaction
                      const tx = escrowSDK.fundEvent(
                        event.id,
                        activeAddress,
                        coin.coinObjectId,
                        escrowRegistryId,
                        clockId
                      );
                      await signAndExecute({ transaction: tx });
                      setSponsorSuccess(
                        "Sponsorship successful! Your funds are now escrowed."
                      );
                      setTimeout(() => setShowSponsorModal(false), 1500);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (e: any) {
                      setSponsorError(e.message || "Failed to sponsor event");
                    } finally {
                      setSponsorLoading(false);
                    }
                  }}
                  disabled={sponsorLoading || sponsorAmount <= 0}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 rounded-xl shadow-lg hover:from-secondary hover:to-primary transition-all text-base min-w-0 font-livvic"
                >
                  {sponsorLoading ? "Sponsoring..." : "Sponsor"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSponsorModal(false)}
                  className="flex-1 border-0 bg-card-secondary text-foreground font-semibold py-2 rounded-xl hover:bg-card transition-all text-base min-w-0 font-livvic"
                  disabled={sponsorLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Flow Modal */}
      {showDocFlowModal && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Document Flow Management
                </h3>
                <p className="text-foreground-secondary text-sm">
                  {event.name} • Approval Workflow
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
                flow={documentFlowData.flow || undefined}
                submissions={documentFlowData.submissions}
                eventName={event.name}
                isLoading={documentFlowLoading}
                onCreateFlow={() => setShowCreateFlowModal(true)}
                onSubmitDocument={() => setShowSubmitDocumentModal(true)}
                onViewFlow={() => {
                  // Could navigate to a detailed view or expand the card
                  console.log("View flow details");
                }}
                onViewSubmissions={() => {
                  // Could show a modal with all submissions
                  console.log("View all submissions");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Document Flow Modal */}
      {showCreateFlowModal && event && (
        <CreateDocumentFlowModal
          isOpen={showCreateFlowModal}
          onClose={() => setShowCreateFlowModal(false)}
          onSubmit={handleCreateDocumentFlow}
          isLoading={documentFlowLoading}
          eventName={event.name}
        />
      )}

      {/* Submit Document Modal */}
      {showSubmitDocumentModal && event && activeAddress && isAuthenticated && (
        <SubmitDocumentModal
          isOpen={showSubmitDocumentModal}
          onClose={() => setShowSubmitDocumentModal(false)}
          onSubmit={handleSubmitDocument}
          eventName={event.name}
          userAddress={activeAddress}
        />
      )}
    </div>
  );
};

export default EventDetails;
