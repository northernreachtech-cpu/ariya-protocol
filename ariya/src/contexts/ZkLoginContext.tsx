import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
// Use any for User type to avoid Firebase import issues
type User = any;
import { signOutZkLogin, getCurrentZkUser, onZkAuthStateChanged } from '../lib/zklogin';

import { useConnectWallet, useWallets, useCurrentAccount } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';

interface ZkLoginContextType {
  zkUser: User | null;
  zkAddress: string | null;
  zkLoginSignature: any | null;
  isZkConnecting: boolean;
  zkLogin: () => Promise<void>;
  zkLogout: () => Promise<void>;
  isZkAuthenticated: boolean;
  executeEnokiTransaction: (transaction: any) => Promise<any>;
}

const ZkLoginContext = createContext<ZkLoginContextType | undefined>(undefined);

export const useZkLogin = () => {
  const context = useContext(ZkLoginContext);
  if (context === undefined) {
    throw new Error('useZkLogin must be used within a ZkLoginProvider');
  }
  return context;
};

interface ZkLoginProviderProps {
  children: ReactNode;
}

export const ZkLoginProvider: React.FC<ZkLoginProviderProps> = ({ children }) => {
  const [zkUser, setZkUser] = useState<User | null>(null);
  const [zkAddress, setZkAddress] = useState<string | null>(null);
  const [zkLoginSignature, setZkLoginSignature] = useState<any | null>(null);
  const [isZkConnecting, setIsZkConnecting] = useState(false);

  // Enoki integration
  const { mutateAsync: connect } = useConnectWallet();
  const wallets = useWallets().filter(isEnokiWallet);
  const googleWallet = wallets.find(wallet => wallet.provider === 'google');
  const currentAccount = useCurrentAccount();

  // Check for existing zkLogin session on mount
  useEffect(() => {
    const currentUser = getCurrentZkUser();
    if (currentUser) {
      setZkUser(currentUser);
      // Note: We'll need to re-derive the address when we have the JWT
    }

    // Listen for auth state changes
    const unsubscribe = onZkAuthStateChanged((user) => {
      setZkUser(user);
      if (!user) {
        setZkAddress(null);
        setZkLoginSignature(null);
      }
    });

    return unsubscribe;
  }, []);

  const zkLogin = async () => {
    try {
      setIsZkConnecting(true);
      
      if (!googleWallet) {
        throw new Error('Google wallet not available');
      }

      // Connect to Google wallet through Enoki (this handles the OAuth flow)
      await connect({ wallet: googleWallet });
      
      // Get the connected account info
      const account = currentAccount;
      if (account) {
        setZkAddress(account.address);
        // For display purposes, we can get user info from the wallet
        setZkUser({ email: account.address, displayName: 'zkLogin User' });
        setZkLoginSignature({ type: 'enoki' });
        
        console.log("✅ zkLogin successful:", {
          address: account.address
        });
      }
    } catch (error) {
      console.error("❌ zkLogin failed:", error);
      throw error;
    } finally {
      setIsZkConnecting(false);
    }
  };

  const zkLogout = async () => {
    try {
      await signOutZkLogin();
      setZkUser(null);
      setZkAddress(null);
      setZkLoginSignature(null);
      console.log("✅ zkLogin logout successful");
    } catch (error) {
      console.error("❌ zkLogin logout failed:", error);
      throw error;
    }
  };

  const executeEnokiTransaction = async (_transaction: any) => {
    // Note: This function is kept for interface compatibility
    // but actual execution should use useSignAndExecuteTransaction from dapp-kit
    // when an Enoki wallet is connected through the wallet standard
    throw new Error("Use useSignAndExecuteTransaction from dapp-kit with Enoki wallets");
  };

  const value: ZkLoginContextType = {
    zkUser,
    zkAddress: zkAddress || currentAccount?.address || null,
    zkLoginSignature,
    isZkConnecting,
    zkLogin,
    zkLogout,
    isZkAuthenticated: !!zkUser && !!(zkAddress || currentAccount?.address),
    executeEnokiTransaction,
  };

  return (
    <ZkLoginContext.Provider value={value}>
      {children}
    </ZkLoginContext.Provider>
  );
};
