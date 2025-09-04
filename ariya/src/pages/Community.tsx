import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  MessageCircle,
  ArrowLeft,
  Plus,
  Send,
  Star,
} from "lucide-react";
import {
  useCurrentAccount,
  // useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import {
  CommunityPostsService,
  CommunityMembersService,
  type ForumPost,
  type CommunityMember,
} from "../lib/firebase";
import Card from "../components/Card";
import Button from "../components/Button";
import useScrollToTop from "../hooks/useScrollToTop";

const Community = () => {
  useScrollToTop();
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const communityRegistryId = useNetworkVariable("communityRegistryId");
  // const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

  const [newPost, setNewPost] = useState("");

  const [showNewPostModal, setShowNewPostModal] = useState(false);

  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId || !currentAccount) return;

      try {
        setLoading(true);
        console.log("🔍 Loading community:", communityId);

        // Check if user has access to this community
        const access = await sdk.communityAccess.checkCommunityAccess(
          communityId,
          currentAccount.address,
          communityRegistryId
        );

        if (!access) {
          console.log("❌ User doesn't have access to community");
          navigate("/events");
          return;
        }

        // Get real community data from blockchain
        console.log("🔍 Fetching real community data from blockchain...");

        // Get community details from the SDK
        const communityDetails = await sdk.communityAccess.getCommunityDetails(
          communityId,
          communityRegistryId
        );

        if (!communityDetails) {
          console.error("❌ Community not found on blockchain");
          navigate("/events");
          return;
        }

        console.log("✅ Real community data:", communityDetails);
        setCommunity(communityDetails);

        // Load real data from Firebase
        console.log("📡 Loading community data from Firebase...");

        // Load posts
        const posts = await CommunityPostsService.getPosts(communityId);
        setForumPosts(posts);
        console.log("📝 Loaded posts:", posts.length);

        // Resources functionality removed
        console.log("📁 Resources functionality disabled");

        // Load members
        const members = await CommunityMembersService.getMembers(communityId);
        setMembers(members);
        console.log("👥 Loaded members:", members.length);

        // Set up real-time listeners
        const unsubscribePosts = CommunityPostsService.subscribeToPosts(
          communityId,
          (newPosts) => {
            setForumPosts(newPosts);
            console.log("🔄 Real-time posts update:", newPosts.length);
          }
        );

        // Update member activity (with error handling)
        try {
          await CommunityMembersService.updateMemberActivity(
            communityId,
            currentAccount.address
          );
        } catch (error) {
          console.warn("⚠️ Could not update member activity:", error);
          // This is not critical, so we continue
        }

        // Cleanup function for real-time listeners
        return () => {
          unsubscribePosts();
        };
      } catch (error) {
        console.error("Error loading community:", error);
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [communityId, currentAccount, communityRegistryId, sdk, navigate]);

  const handleNewPost = async () => {
    if (!newPost.trim() || !communityId) return;

    try {
      await CommunityPostsService.createPost({
        communityId,
        authorId: currentAccount!.address,
        authorName: currentAccount!.address, // Using address as name for now
        content: newPost,
        likes: [],
      });

      setNewPost("");
      setShowNewPostModal(false);
      console.log("✅ Post created successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentAccount) return;

    try {
      await CommunityPostsService.toggleLike(postId, currentAccount.address);
      console.log("✅ Like toggled successfully");
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to like post. Please try again.");
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-black pt-20 pb-6 sm:pb-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-white/60">
              Please connect your wallet to access the community.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-foreground-muted mt-4">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-events")}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </div>

            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-livvic font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-3 sm:mb-4">
                {community?.name || "Community"}
              </h1>
              <p className="text-foreground-muted text-xs sm:text-sm lg:text-base max-w-2xl mx-auto px-4">
                {community?.description}
              </p>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="p-3 sm:p-4 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-primary mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {members.length}
              </div>
              <div className="text-foreground-muted text-xs sm:text-sm">
                Members
              </div>
            </Card>
            <Card className="p-3 sm:p-4 text-center">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-secondary mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {forumPosts.length}
              </div>
              <div className="text-foreground-muted text-xs sm:text-sm">
                Posts
              </div>
            </Card>
            <Card className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                0
              </div>
              <div className="text-foreground-muted text-xs sm:text-sm">
                Resources
              </div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="flex space-x-1 bg-card rounded-lg p-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === "overview"
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("forum")}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === "forum"
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Forum
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === "members"
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Members
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="w-full">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-foreground">
                    <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {forumPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="p-3 sm:p-4 bg-card-secondary rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-xs sm:text-sm text-foreground-muted truncate">
                            {formatAddress(post.authorId)}
                          </span>
                          <span className="text-xs text-foreground-muted flex-shrink-0">
                            {formatDate(post.timestamp)}
                          </span>
                        </div>
                        <p className="text-foreground text-sm sm:text-base leading-relaxed line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Forum Tab */}
            {activeTab === "forum" && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold flex items-center text-foreground">
                    <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Community Forum
                  </h3>
                  <Button
                    onClick={() => setShowNewPostModal(true)}
                    className="flex items-center text-sm sm:text-base"
                    size="sm"
                  >
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    New Post
                  </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {forumPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-3 sm:p-4 bg-card-secondary rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs sm:text-sm font-medium">
                              {post.authorId.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {formatAddress(post.authorId)}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              {formatDate(post.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            className="text-foreground-muted hover:text-foreground p-1"
                            onClick={() => handleToggleLike(post.id!)}
                          >
                            <Star
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                post.likes?.includes(
                                  currentAccount?.address || ""
                                )
                                  ? "text-yellow-400 fill-current"
                                  : ""
                              }`}
                            />
                          </button>
                          <span className="text-xs text-foreground-muted">
                            {post.likes?.length || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-foreground text-sm sm:text-base leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center text-foreground">
                  <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  Community Members
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {members.map((member, index) => (
                    <div
                      key={member.userId}
                      className="p-3 sm:p-4 bg-card-secondary rounded-lg border border-border"
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-accent text-xs font-medium">
                              {member.userId.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-medium text-foreground text-sm truncate">
                                {formatAddress(member.userId)}
                              </span>
                              {member.role === "moderator" && (
                                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex-shrink-0">
                                  Mod
                                </span>
                              )}
                              {index === 0 && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex-shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-foreground-muted">Joined</div>
                            <div className="text-foreground">
                              {formatDate(member.joinedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-foreground-muted">Points</div>
                            <div className="text-foreground font-medium">
                              {member.contributionScore}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-foreground-muted">
                          Last active: {formatDate(member.lastActive)}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                            <span className="text-accent text-sm font-medium">
                              {member.userId.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {formatAddress(member.userId)}
                              </span>
                              {member.role === "moderator" && (
                                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                  Moderator
                                </span>
                              )}
                              {index === 0 && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-foreground-muted">
                              Joined {formatDate(member.joinedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-foreground">
                              {member.contributionScore}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              Points
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-foreground-muted">
                              {formatDate(member.lastActive)}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              Last Active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-card backdrop-blur-xl border border-border rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">
              Create New Post
            </h3>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts with the community..."
              className="w-full h-24 sm:h-32 p-3 bg-card-secondary border border-border rounded-lg text-foreground placeholder-foreground-muted resize-none focus:outline-none focus:border-primary text-sm sm:text-base"
            />
            <div className="flex gap-2 sm:gap-3 mt-4">
              <Button
                onClick={handleNewPost}
                className="flex-1 text-sm sm:text-base"
              >
                <Send className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Post
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewPostModal(false)}
                className="flex-1 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
