import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  X,
  Shield,
} from "lucide-react";
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import Button from "./Button";
import Card from "./Card";
import { useZkLogin } from "../contexts/ZkLoginContext";

const ConnectWalletButton = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  
  // zkLogin context
  const { 
    zkUser, 
    zkAddress, 
    isZkConnecting, 
    zkLogin, 
    zkLogout, 
    isZkAuthenticated 
  } = useZkLogin();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const openExplorer = (address: string) => {
    window.open(`https://suiscan.xyz/mainnet/account/${address}`, "_blank");
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !isMobile // Disable for mobile to prevent interference
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  const handleConnect = (walletName: string) => {
    console.log("🔗 Attempting to connect wallet:", walletName);
    setIsConnecting(true);
    const wallet = wallets.find((w) => w.name === walletName);
    if (wallet) {
      console.log("✅ Wallet found, connecting...");
      connect(
        { wallet },
        {
          onSuccess: () => {
            console.log("✅ Wallet connected successfully");
            // Small delay to ensure connection is processed
            setTimeout(() => {
              setShowDropdown(false);
              setIsConnecting(false);
            }, 500);
          },
          onError: (error) => {
            console.error("❌ Wallet connection failed:", error);
            setIsConnecting(false);
          },
        }
      );
    } else {
      console.error("❌ Wallet not found:", walletName);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log("🔌 Disconnecting wallet...");
    disconnect();
    // Small delay to ensure disconnection is processed
    setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  // Get wallet info for display
  const getWalletDisplayInfo = (walletName: string) => {
    switch (walletName) {
      case "Sui Wallet":
        return { icon: "🔵", description: "Official Sui Wallet" };
      case "Suiet":
        return { icon: "💎", description: "Suiet Wallet" };
      case "Martian Sui Wallet":
        return { icon: "🚀", description: "Martian Wallet" };
      case "Ethos Wallet":
        return { icon: "⚡", description: "Ethos Wallet" };
      default:
        return { icon: "💳", description: "Sui Wallet" };
    }
  };

  // Check if user is authenticated via any method
  const isAuthenticated = currentAccount || isZkAuthenticated;
  const displayAddress = currentAccount?.address || zkAddress;
  currentAccount || zkUser;
  
  if (!isAuthenticated) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => {
            setShowDropdown(!showDropdown);
          }}
          className={`relative transition-all duration-300 ${
            showDropdown ? "ring-2 ring-primary/50 border-primary/50" : ""
          }`}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform duration-300 ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </Button>

        {showDropdown &&
          (isMobile ? (
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-[9999] bg-background/20 backdrop-blur-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDropdown(false);
                  }}
                />
                <div className="fixed top-20 right-4 left-4 z-[10000] mx-auto">
                  <div
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Card className="min-w-0 w-full max-w-md p-6 shadow-2xl border border-border bg-background/90 backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground">
                          Connect Wallet
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDropdown(false);
                          }}
                          className="p-1 rounded-lg hover:bg-card transition-colors"
                        >
                          <X className="h-4 w-4 text-foreground-muted" />
                        </button>
                      </div>
                      <div
                        className="space-y-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {wallets.map((wallet) => {
                          const displayInfo = getWalletDisplayInfo(wallet.name);
                          return (
                            <button
                              key={wallet.name}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log(
                                  "🎯 Mobile wallet button clicked:",
                                  wallet.name
                                );
                                handleConnect(wallet.name);
                              }}
                              disabled={isConnecting}
                              className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center ${
                                isConnecting
                                  ? "bg-card border-border text-foreground-muted cursor-not-allowed"
                                  : "bg-card hover:bg-card-secondary border-border hover:border-primary/30"
                              }`}
                            >
                              <span className="text-xl mr-3">
                                {displayInfo.icon}
                              </span>
                              <div>
                                <div className="font-medium text-foreground">
                                  {wallet.name}
                                </div>
                                <div className="text-sm text-foreground-muted">
                                  {isConnecting
                                    ? "Connecting..."
                                    : displayInfo.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        
                        {/* Divider */}
                        <div className="my-3 border-t border-border" />
                        
                        {/* zkLogin Button */}
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await zkLogin();
                              setShowDropdown(false);
                            } catch (error) {
                              console.error("zkLogin failed:", error);
                            }
                          }}
                          disabled={isZkConnecting}
                          className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center ${
                            isZkConnecting
                              ? "bg-card border-border text-foreground-muted cursor-not-allowed"
                              : "bg-card hover:bg-card-secondary border-border hover:border-primary/30"
                          }`}
                        >
                          <Shield className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div className="font-medium text-foreground">
                              zkLogin (Google)
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {isZkConnecting
                                ? "Connecting..."
                                : "Sign in with Google"}
                            </div>
                          </div>
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              </>,
              document.body
            )
          ) : (
            <>
              <div className="fixed inset-0 z-[9999] bg-background/20 backdrop-blur-sm" />
              <div className="absolute top-full right-0 mt-3 z-[10000]">
                <Card className="min-w-80 p-6 shadow-2xl border border-border bg-background/90 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">
                      Connect Wallet
                    </h3>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="p-1 rounded-lg hover:bg-card transition-colors"
                    >
                      <X className="h-4 w-4 text-foreground-muted" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {wallets.map((wallet) => {
                      const displayInfo = getWalletDisplayInfo(wallet.name);
                      return (
                        <button
                          key={wallet.name}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleConnect(wallet.name);
                          }}
                          disabled={isConnecting}
                          className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center ${
                            isConnecting
                              ? "bg-card border-border text-foreground-muted cursor-not-allowed"
                              : "bg-card hover:bg-card-secondary border-border hover:border-primary/30"
                          }`}
                        >
                          <span className="text-xl mr-3">
                            {displayInfo.icon}
                          </span>
                          <div>
                            <div className="font-medium text-foreground">
                              {wallet.name}
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {isConnecting
                                ? "Connecting..."
                                : displayInfo.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Divider */}
                    <div className="my-3 border-t border-border" />
                    
                    {/* zkLogin Button */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await zkLogin();
                          setShowDropdown(false);
                        } catch (error) {
                          console.error("zkLogin failed:", error);
                        }
                      }}
                      disabled={isZkConnecting}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center ${
                        isZkConnecting
                          ? "bg-card border-border text-foreground-muted cursor-not-allowed"
                          : "bg-card hover:bg-card-secondary border-border hover:border-primary/30"
                      }`}
                    >
                      <Shield className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">
                          zkLogin (Google)
                        </div>
                        <div className="text-sm text-foreground-muted">
                          {isZkConnecting
                            ? "Connecting..."
                            : "Sign in with Google"}
                        </div>
                      </div>
                    </button>
                  </div>
                </Card>
              </div>
            </>
          ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative transition-all duration-300 ${
          showDropdown ? "ring-2 ring-primary/50 border-primary/50" : ""
        }`}
      >
        {currentAccount ? (
          <Wallet className="mr-2 h-4 w-4" />
        ) : (
          <Shield className="mr-2 h-4 w-4" />
        )}
        {formatAddress(displayAddress || "")}
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-300 ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </Button>

      {showDropdown &&
        (isMobile ? (
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[9999] bg-background/20 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDropdown(false);
                }}
              />
              <div className="fixed top-20 right-4 left-4 z-[10000] mx-auto">
                <div
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Card className="min-w-0 w-full max-w-md p-6 shadow-2xl border border-border bg-background/90 backdrop-blur-xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">
                          Account
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDropdown(false);
                          }}
                          className="p-1 rounded-lg hover:bg-card transition-colors"
                        >
                          <X className="h-4 w-4 text-foreground-muted" />
                        </button>
                      </div>
                      <div
                        className="p-3 rounded-lg bg-card border border-border"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="text-sm text-foreground-muted mb-1">
                          {currentAccount ? "Wallet Address" : "zkLogin Address"}
                        </div>
                        <div className="font-mono text-foreground text-sm break-all">
                          {displayAddress}
                        </div>
                        {zkUser && (
                          <div className="text-xs text-foreground-muted mt-1">
                            {zkUser.email}
                          </div>
                        )}
                      </div>
                      <div
                        className="flex gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            copyToClipboard(displayAddress || "");
                          }}
                          className="flex-1"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copiedAddress ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            openExplorer(displayAddress || "");
                          }}
                          className="flex-1"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Explorer
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          console.log("🎯 Mobile disconnect button clicked");
                          if (currentAccount) {
                            handleDisconnect();
                          } else {
                            await zkLogout();
                          }
                          setShowDropdown(false);
                        }}
                        className="w-full text-red-400 hover:text-red-300 hover:border-red-400/50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </>,
            document.body
          )
        ) : (
          <>
            <div className="fixed inset-0 z-[9999] bg-background/20 backdrop-blur-sm" />
            <div className="absolute top-full right-0 mt-3 z-[10000]">
              <Card className="min-w-80 p-6 shadow-2xl border border-border bg-background/90 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                      Account
                    </h3>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="p-1 rounded-lg hover:bg-card transition-colors"
                    >
                      <X className="h-4 w-4 text-foreground-muted" />
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <div className="text-sm text-foreground-muted mb-1">
                      {currentAccount ? "Wallet Address" : "zkLogin Address"}
                    </div>
                    <div className="font-mono text-foreground text-sm break-all">
                      {displayAddress}
                    </div>
                    {zkUser && (
                      <div className="text-xs text-foreground-muted mt-1">
                        {zkUser.email}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(displayAddress || "")}
                      className="flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedAddress ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openExplorer(displayAddress || "")}
                      className="flex-1"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Explorer
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (currentAccount) {
                        handleDisconnect();
                      } else {
                        await zkLogout();
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full text-red-400 hover:text-red-300 hover:border-red-400/50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </Card>
            </div>
          </>
        ))}
    </div>
  );
};

export default ConnectWalletButton;
