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
  useSuiClient,
} from "@mysten/dapp-kit";
import Button from "./Button";
import Card from "./Card";
import { useZkLogin } from "../contexts/ZkLoginContext";

// Google Icon Component
const GoogleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const ConnectWalletButton = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
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

  // Fetch balance for the connected wallet
  const fetchBalance = async (address: string) => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await suiClient.getBalance({
        owner: address,
        coinType: "0x2::sui::SUI"
      });
      
      // Convert balance to Sui (divide by 10^9) and format to 2 decimal places
      const balanceInSui = Number(balanceData.totalBalance) / 1000000000;
      const formattedBalance = balanceInSui.toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch balance when address changes
  useEffect(() => {
    const activeAddress = currentAccount?.address || zkAddress;
    if (activeAddress) {
      fetchBalance(activeAddress);
    } else {
      setBalance(null);
    }
  }, [currentAccount?.address, zkAddress]);

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
          <GoogleIcon className="mr-2 h-4 w-4" />
          Sign in with Google
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
                          <GoogleIcon className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium text-foreground">
                              Sign in with Google
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {isZkConnecting
                                ? "Connecting..."
                                : "Use your Google account"}
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
                          Sign in with Google
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
                          <GoogleIcon className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium text-foreground">
                              Sign in with Google
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {isZkConnecting
                                ? "Connecting..."
                                : "Use your Google account"}
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
        {balance && (
          <span className="ml-2 text-sm text-foreground-muted">
            {isLoadingBalance ? "..." : `${balance} SUI`}
          </span>
        )}
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
                        {balance && (
                          <div className="text-sm text-foreground-muted mt-1">
                            Balance: {isLoadingBalance ? "Loading..." : `${balance} SUI`}
                          </div>
                        )}
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
                    {balance && (
                      <div className="text-sm text-foreground-muted mt-1">
                        Balance: {isLoadingBalance ? "Loading..." : `${balance} SUI`}
                      </div>
                    )}
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
