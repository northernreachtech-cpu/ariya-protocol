import { useState } from "react";
import { Wallet, X } from "lucide-react";
import {
  useConnectWallet,
  useWallets,
} from "@mysten/dapp-kit";

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

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const WalletConnectionModal = ({ 
  isOpen, 
  onClose, 
  title = "Connect Your Wallet",
  description = "Choose how you'd like to connect to register for this event"
}: WalletConnectionModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { mutate: connect } = useConnectWallet();
  const wallets = useWallets();
  
  // zkLogin context
  const { 
    isZkConnecting, 
    zkLogin, 

  } = useZkLogin();

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
            setTimeout(() => {
              onClose();
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

  const handleZkLogin = async () => {
    try {
      await zkLogin();
      onClose();
    } catch (error) {
      console.error("❌ zkLogin failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-card transition-colors"
          >
            <X className="h-4 w-4 text-foreground-muted" />
          </button>
        </div>

        <p className="text-foreground-secondary mb-6">
          {description}
        </p>

        <div className="space-y-3">
          {/* zkLogin Button - Google Sign In */}
          <button
            onClick={handleZkLogin}
            disabled={isZkConnecting || isConnecting}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-card-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="h-5 w-5" />
            <span className="font-medium">
              {isZkConnecting ? "Connecting..." : "Sign in with Google"}
            </span>
          </button>

          {/* Regular Wallet Options */}
          {wallets
            .filter((wallet) => wallet.name !== "Enoki")
            .map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                disabled={isConnecting || isZkConnecting}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-card-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="h-5 w-5" />
                <span className="font-medium">
                  {isConnecting ? "Connecting..." : `Connect ${wallet.name}`}
                </span>
              </button>
            ))}
        </div>

        <div className="mt-6 p-4 bg-card-secondary rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Why connect?</h4>
          <ul className="text-sm text-foreground-secondary space-y-1">
            <li>• Register for events and receive NFTs</li>
            <li>• Access exclusive community features</li>
            <li>• Manage your event attendance and history</li>
            <li>• Participate in event discussions and activities</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default WalletConnectionModal;
