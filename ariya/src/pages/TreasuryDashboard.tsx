import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Settings } from 'lucide-react';
import { useAriyaSDK, type TreasuryStatus } from '../lib/sdk';
import { useNetworkVariable } from '../config/sui';
import TreasuryStats from '../components/TreasuryStats';
import AdminControls from '../components/AdminControls';
import TreasuryHistory from '../components/TreasuryHistory';
import WalletConnectionPrompt from '../components/WalletConnectionPrompt';

const TreasuryDashboard: React.FC = () => {
  const [treasuryData, setTreasuryData] = useState<TreasuryStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const platformTreasuryId = useNetworkVariable('platformTreasuryId');

  const loadTreasuryData = async () => {
    if (!platformTreasuryId) {
      setError('Treasury ID not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load treasury status
      const status = await sdk.platformTreasury.getTreasuryStatus(platformTreasuryId);
      if (!status) {
        setError('Failed to load treasury data');
        setLoading(false);
        return;
      }

      setTreasuryData(status);

      // Check if current user is admin
      if (currentAccount?.address) {
        const adminStatus = await sdk.platformTreasury.isAdmin(
          platformTreasuryId,
          currentAccount.address
        );
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }

    } catch (error) {
      console.error('Error loading treasury data:', error);
      setError('Failed to load treasury data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreasuryData();
  }, [platformTreasuryId, currentAccount?.address]);

  if (!currentAccount) {
    return (
      <WalletConnectionPrompt
        title="Connect Your Wallet"
        description="Please connect your wallet to access the treasury dashboard."
        icon={<Settings className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">
                  Error Loading Treasury
                </h3>
                <div className="mt-2 text-sm text-foreground-secondary">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadTreasuryData}
                    className="bg-card border border-border px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!treasuryData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Treasury Not Found</h2>
            <p className="mt-2 text-foreground-secondary">
              The platform treasury could not be found or accessed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Platform Treasury
            </h1>
            <p className="mt-2 text-foreground-secondary">
              Manage and monitor the Ariya Protocol treasury funds and operations.
            </p>
          </div>
        </div>

        {/* Treasury Stats */}
        <div className="mb-8">
          <TreasuryStats treasuryData={treasuryData} isAdmin={isAdmin} />
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mb-8">
            <AdminControls
              treasuryId={platformTreasuryId}
              currentBalance={treasuryData.balance}
              onActionComplete={loadTreasuryData}
            />
          </div>
        )}

        {/* Treasury History */}
        <div className="mb-8">
          <TreasuryHistory treasuryId={platformTreasuryId} />
        </div>

        {/* Information Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-foreground">
                Treasury Information
              </h3>
              <div className="mt-2 text-sm text-foreground-secondary">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Public Access:</strong> Anyone can view treasury balance, admin address, and transaction history.
                  </li>
                  <li>
                    <strong>Admin Operations:</strong> Only the treasury admin can withdraw funds or transfer admin rights.
                  </li>
                  <li>
                    <strong>Fee Collection:</strong> Platform fees are automatically collected from event registrations and subscriptions.
                  </li>
                  <li>
                    <strong>Transparency:</strong> All treasury operations are recorded on-chain and publicly auditable.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryDashboard;
