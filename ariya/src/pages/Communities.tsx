import { useEffect, useState } from "react";
import {
  useCurrentAccount,
  // useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../config/sui";
import Card from "../components/Card";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Users, Lock, Unlock } from "lucide-react";

const Communities = () => {
  const currentAccount = useCurrentAccount();
  // const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sdk = useAriyaSDK();
  const communityRegistryId = useNetworkVariable("communityRegistryId");
  const nftRegistryId = useNetworkVariable("nftRegistryId");
  const registrationRegistryId = useNetworkVariable("registrationRegistryId");
  const attendanceRegistryId = useNetworkVariable("attendanceRegistryId");
  const [allCommunities, setAllCommunities] = useState<any[]>([]);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [_activeUserCommunities, setActiveUserCommunities] = useState<any[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  // const [_joining, setJoining] = useState<string | null>(null);
  const [membershipChecks, setMembershipChecks] = useState<{
    [key: string]: { isActive: boolean; reason?: string };
  }>({});
  const [userEventStatuses, setUserEventStatuses] = useState<{
    [eventId: string]: {
      isRegistered: boolean;
      attendanceState: number;
      hasPoANFT: boolean;
    };
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!currentAccount || !communityRegistryId || !nftRegistryId) return;
      setLoading(true);
      try {
        // Get all communities (across all events)
        const all = await sdk.communityAccess.getAllCommunities();
        console.log("🔍 All communities:", all);
        setAllCommunities(all);

        // Get user's joined communities (has access objects)
        const user = await sdk.communityAccess.getUserCommunities(
          currentAccount.address,
          communityRegistryId
        );
        console.log("🔍 User's joined communities:", user);
        setUserCommunities(user);

        // Get user's active communities (verified active membership)
        const active = await sdk.communityAccess.getActiveUserCommunities(
          currentAccount.address,
          communityRegistryId,
          nftRegistryId
        );
        setActiveUserCommunities(active);

        // Check membership status for each community the user has joined
        const checks: {
          [key: string]: { isActive: boolean; reason?: string };
        } = {};
        for (const community of user) {
          const check = await sdk.communityAccess.isActiveCommunityMember(
            community.id,
            currentAccount.address,
            communityRegistryId,
            nftRegistryId
          );
          checks[community.id] = check;
        }
        setMembershipChecks(checks);

        // Check user event statuses for all communities
        const eventStatusPromises = all.map(async (community) => {
          if (community.event_id) {
            await checkUserEventStatus(community.event_id);
          }
        });
        await Promise.all(eventStatusPromises);
      } catch (e) {
        console.error("Error fetching communities:", e);
        setAllCommunities([]);
        setUserCommunities([]);
        setActiveUserCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [currentAccount, sdk, communityRegistryId, nftRegistryId]);

  // Check for PoA NFT membership after event statuses are loaded
  useEffect(() => {
    const checkPoANFTMembership = async () => {
      if (
        !currentAccount ||
        !communityRegistryId ||
        !nftRegistryId ||
        allCommunities.length === 0
      )
        return;

      for (const community of allCommunities) {
        if (community.event_id) {
          const eventStatus = userEventStatuses[community.event_id];
          if (
            eventStatus &&
            eventStatus.hasPoANFT &&
            eventStatus.attendanceState >= 1
          ) {
            // User has PoA NFT and is checked in - check if they should be a member
            const shouldBeMember =
              eventStatus.isRegistered && eventStatus.hasPoANFT;
            if (shouldBeMember && !isJoined(community.id)) {
              // User should be a member but isn't - add them to user communities
              console.log(
                `🔍 User should be member of ${community.id} based on PoA NFT`
              );
              setUserCommunities((prev) => {
                if (!prev.some((c) => c.id === community.id)) {
                  return [...prev, community];
                }
                return prev;
              });

              // Check their membership status
              const check = await sdk.communityAccess.isActiveCommunityMember(
                community.id,
                currentAccount.address,
                communityRegistryId,
                nftRegistryId
              );
              setMembershipChecks((prev) => ({
                ...prev,
                [community.id]: check,
              }));
            }
          }
        }
      }
    };

    checkPoANFTMembership();
  }, [
    userEventStatuses,
    allCommunities,
    currentAccount,
    sdk,
    communityRegistryId,
    nftRegistryId,
  ]);

  // const handleJoin = async (community: any) => {
  //   if (!currentAccount || !nftRegistryId || !communityRegistryId) return;
  //   setJoining(community.id);
  //   try {
  //     const tx = sdk.communityAccess.requestCommunityAccess(
  //       community.id,
  //       currentAccount.address,
  //       nftRegistryId,
  //       communityRegistryId
  //     );
  //     await signAndExecute({ transaction: tx });
  //     setUserCommunities((prev) => [...prev, community]);
  //     // Refresh membership checks
  //     const check = await sdk.communityAccess.isActiveCommunityMember(
  //       community.id,
  //       currentAccount.address,
  //       communityRegistryId,
  //       nftRegistryId
  //     );
  //     setMembershipChecks((prev) => ({ ...prev, [community.id]: check }));
  //   } catch (e) {
  //     console.error("Failed to join community:", e);
  //   } finally {
  //     setJoining(null);
  //   }
  // };

  const isJoined = (communityId: string) => {
    const joined = userCommunities.some((c) => c.id === communityId);
    console.log(
      `🔍 Checking if joined ${communityId}:`,
      joined,
      "User communities:",
      userCommunities.map((c) => c.id)
    );
    return joined;
  };

  // const isActiveMember = (communityId: string) =>
  //   activeUserCommunities.some((c) => c.id === communityId);

  const checkUserEventStatus = async (eventId: string) => {
    if (
      !currentAccount ||
      !registrationRegistryId ||
      !attendanceRegistryId ||
      !nftRegistryId
    ) {
      return;
    }

    try {
      // Check registration status
      const registration = await sdk.identityAccess.getRegistrationStatus(
        eventId,
        currentAccount.address,
        registrationRegistryId
      );

      // Check attendance status
      let attendanceState = 0;
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${sdk.attendanceVerification.getPackageId()}::attendance_verification::get_attendance_status`,
          arguments: [
            tx.pure.address(currentAccount.address),
            tx.pure.id(eventId),
            tx.object(attendanceRegistryId),
          ],
        });
        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount.address,
        });

        if (result && result.results && result.results.length > 0) {
          const returnVals = result.results[0].returnValues;
          if (Array.isArray(returnVals) && returnVals.length >= 4) {
            attendanceState = Array.isArray(returnVals[1])
              ? (returnVals[1][0] as unknown as number)
              : parseInt(returnVals[1] as string) || 0;
          }
        }
      } catch (e) {
        attendanceState = 0;
      }

      // Check PoA NFT ownership
      let hasPoANFT = false;
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${sdk.attendanceVerification.getPackageId()}::nft_minting::has_proof_of_attendance`,
          arguments: [
            tx.pure.address(currentAccount.address),
            tx.pure.id(eventId),
            tx.object(nftRegistryId),
          ],
        });
        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: currentAccount.address,
        });

        if (result && result.results && result.results.length > 0) {
          const returnVals = result.results[0].returnValues;
          if (Array.isArray(returnVals) && returnVals.length > 0) {
            hasPoANFT = Array.isArray(returnVals[0])
              ? returnVals[0].length > 0
              : !!returnVals[0];
          }
        }
      } catch (e) {
        hasPoANFT = false;
      }

      setUserEventStatuses((prev) => ({
        ...prev,
        [eventId]: {
          isRegistered: !!registration,
          attendanceState,
          hasPoANFT,
        },
      }));
    } catch (e) {
      console.error(`Error checking event status for ${eventId}:`, e);
    }
  };

  const getMembershipStatus = (communityId: string) => {
    // Check if user has joined this community
    const isUserJoined = isJoined(communityId);

    if (!isUserJoined) {
      return { status: "not-joined", icon: null, color: "text-white/50" };
    }

    // User has joined, check their active membership status
    const check = membershipChecks[communityId];
    if (!check) {
      return { status: "checking", icon: Clock, color: "text-yellow-400" };
    }

    if (check.isActive) {
      return { status: "active", icon: CheckCircle, color: "text-green-400" };
    }

    return {
      status: "inactive",
      icon: XCircle,
      color: "text-red-400",
      reason: check.reason,
    };
  };

  const getCommunityButtonState = (community: any) => {
    const membershipStatus = getMembershipStatus(community.id);
    const eventStatus = userEventStatuses[community.event_id];

    // If user is an active member, show "Open Community"
    if (membershipStatus.status === "active") {
      return {
        text: "Open Community",
        icon: Users,
        variant: "primary" as const,
        onClick: () => navigate(`/community/${community.id}`),
        disabled: false,
        color: "text-green-400",
        message: "You have full access to this community",
      };
    }

    // If user has joined but is inactive, show "Rejoin Community"
    if (membershipStatus.status === "inactive") {
      return {
        text: "Rejoin Community",
        icon: Lock,
        variant: "secondary" as const,
        onClick: () => navigate(`/event/${community.event_id}`),
        disabled: false,
        color: "text-red-400",
        message: membershipStatus.reason || "Membership expired or invalid",
      };
    }

    // If user hasn't joined, check their event status
    if (!eventStatus) {
      return {
        text: "Checking...",
        icon: Clock,
        variant: "secondary" as const,
        onClick: () => {},
        disabled: true,
        color: "text-yellow-400",
        message: "Checking your event status...",
      };
    }

    // User hasn't registered for the event
    if (!eventStatus.isRegistered) {
      return {
        text: "Register for Event First",
        icon: Lock,
        variant: "secondary" as const,
        onClick: () => navigate(`/event/${community.event_id}`),
        disabled: false,
        color: "text-red-400",
        message: "You need to register for the event first",
      };
    }

    // User is registered but hasn't checked in
    if (eventStatus.attendanceState === 0) {
      return {
        text: "Check In to Event First",
        icon: Lock,
        variant: "secondary" as const,
        onClick: () => navigate(`/event/${community.event_id}`),
        disabled: false,
        color: "text-yellow-400",
        message: "You need to check in to the event first",
      };
    }

    // User is checked in but hasn't minted PoA NFT
    if (eventStatus.attendanceState >= 1 && !eventStatus.hasPoANFT) {
      return {
        text: "Mint PoA NFT First",
        icon: Lock,
        variant: "secondary" as const,
        onClick: () => navigate(`/event/${community.event_id}`),
        disabled: false,
        color: "text-yellow-400",
        message: "You need to mint your Proof of Attendance NFT first",
      };
    }

    // User has PoA NFT - check if they should already be a member
    if (eventStatus.hasPoANFT) {
      // Check if user should already be a member based on PoA NFT ownership
      const shouldBeMember =
        eventStatus.attendanceState >= 1 && eventStatus.hasPoANFT;

      if (shouldBeMember && !isJoined(community.id)) {
        // User has PoA NFT but isn't a member - they might need to join
        return {
          text: "Join Community",
          icon: Unlock,
          variant: "secondary" as const,
          onClick: () => navigate(`/event/${community.event_id}`),
          disabled: false,
          color: "text-green-400",
          message: "You're eligible to join this community",
        };
      } else if (shouldBeMember && isJoined(community.id)) {
        // User has PoA NFT and should be a member - check if membership is active
        const check = membershipChecks[community.id];
        if (check && check.isActive) {
          return {
            text: "Open Community",
            icon: Users,
            variant: "primary" as const,
            onClick: () => navigate(`/community/${community.id}`),
            disabled: false,
            color: "text-green-400",
            message: "You have full access to this community",
          };
        } else {
          return {
            text: "Rejoin Community",
            icon: Lock,
            variant: "secondary" as const,
            onClick: () => navigate(`/event/${community.event_id}`),
            disabled: false,
            color: "text-red-400",
            message: "Membership needs to be renewed",
          };
        }
      }
    }

    // Fallback - navigate to event details
    return {
      text: "View Event Details",
      icon: Lock,
      variant: "secondary" as const,
      onClick: () => navigate(`/event/${community.event_id}`),
      disabled: false,
      color: "text-white/50",
      message: "View event details to join community",
    };
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-livvic font-bold mb-3 text-foreground">
            Communities
          </h1>
          <p className="text-foreground-secondary text-base sm:text-lg max-w-2xl mx-auto font-open-sans">
            Discover and join event communities. Access forums, resources, and
            connect with other attendees.
          </p>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-foreground-muted mt-4">Loading communities...</p>
          </div>
        ) : allCommunities.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
              No communities found
            </h3>
            <p className="text-foreground-muted mb-6 max-w-md mx-auto">
              Communities will appear here as organizers create them for events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allCommunities.map((community) => {
              const membershipStatus = getMembershipStatus(community.id);
              const StatusIcon = membershipStatus.icon;
              const buttonState = getCommunityButtonState(community);
              const ButtonIcon = buttonState.icon;

              return (
                <Card
                  key={community.id}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold mb-1 text-foreground font-livvic">
                        {community.name || "Untitled Community"}
                      </h3>
                      {StatusIcon && (
                        <StatusIcon
                          className={`h-5 w-5 ${membershipStatus.color}`}
                        />
                      )}
                    </div>
                    <p className="text-foreground-muted text-sm mb-2">
                      {community.description || "No description provided."}
                    </p>
                    <div className="text-xs text-foreground-muted mb-2">
                      Event: {community.event_id?.slice(0, 8)}...
                      <br />
                      Community ID: {community.id.slice(0, 8)}...
                    </div>

                    {/* Status Message */}
                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg mb-3 text-xs ${
                        buttonState.color === "text-green-400"
                          ? "bg-green-500/10 border border-green-500/20 text-green-300"
                          : buttonState.color === "text-yellow-400"
                          ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-300"
                          : buttonState.color === "text-red-400"
                          ? "bg-red-500/10 border border-red-500/20 text-red-300"
                          : "bg-gray-500/10 border border-gray-500/20 text-gray-300"
                      }`}
                    >
                      <ButtonIcon className="h-4 w-4" />
                      <span>{buttonState.message}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      variant={buttonState.variant}
                      onClick={buttonState.onClick}
                      disabled={buttonState.disabled}
                    >
                      <ButtonIcon className="mr-2 h-4 w-4" />
                      {buttonState.text}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;
