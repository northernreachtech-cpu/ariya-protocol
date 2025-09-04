import React, { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useAriyaSDK } from '../lib/sdk';
import { useNetworkVariable } from '../config/sui';
import { parseMoveAbortError } from '../utils/errorMessages';

interface AdminControlsProps {
  treasuryId: string;
  currentBalance: number;
  onActionComplete: () => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({ 
  
  currentBalance, 
  onActionComplete 
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const platformTreasuryId = useNetworkVariable('platformTreasuryId');

  const formatSUI = (amount: number) => {
    return (amount / 1e9).toFixed(4);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountInMist = Math.floor(parseFloat(withdrawAmount) * 1e9);
      
      if (amountInMist > currentBalance) {
        setError('Insufficient treasury balance');
        setLoading(false);
        return;
      }

      // Get admin capability ID
      if (!currentAccount?.address) {
        setError('No wallet connected');
        setLoading(false);
        return;
      }

      const adminCapId = await sdk.platformTreasury.getAdminCapabilityId(
        platformTreasuryId,
        currentAccount.address
      );

      if (!adminCapId) {
        setError('Admin capability not found');
        setLoading(false);
        return;
      }

      const tx = sdk.platformTreasury.withdrawFunds(
        platformTreasuryId,
        adminCapId,
        amountInMist
      );

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Withdrawal successful:', result);
            setWithdrawAmount('');
            onActionComplete();
            setError(null);
          },
          onError: (error) => {
            console.error('Withdrawal failed:', error);
            const errorMessage = parseMoveAbortError(error.message);
            setError(errorMessage || 'Withdrawal failed. Please try again.');
          },
        }
      );

    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminAddress) {
      setError('Please enter a valid admin address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get admin capability ID
      if (!currentAccount?.address) {
        setError('No wallet connected');
        setLoading(false);
        return;
      }

      const adminCapId = await sdk.platformTreasury.getAdminCapabilityId(
        platformTreasuryId,
        currentAccount.address
      );

      if (!adminCapId) {
        setError('Admin capability not found');
        setLoading(false);
        return;
      }

      const tx = sdk.platformTreasury.transferAdmin(
        platformTreasuryId,
        adminCapId,
        newAdminAddress
      );

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Admin transfer successful:', result);
            setNewAdminAddress('');
            onActionComplete();
            setError(null);
          },
          onError: (error) => {
            console.error('Admin transfer failed:', error);
            const errorMessage = parseMoveAbortError(error.message);
            setError(errorMessage || 'Admin transfer failed. Please try again.');
          },
        }
      );

    } catch (error) {
      console.error('Admin transfer error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-controls bg-card rounded-lg p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-6">Admin Controls</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-card border border-border rounded-md">
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Withdraw Funds */}
        <div className="control-section">
          <h4 className="text-md font-medium text-foreground mb-4">Withdraw Funds</h4>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Amount (SUI)
              </label>
              <input
                type="number"
                step="0.001"
                max={formatSUI(currentBalance)}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-input-background text-foreground"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-foreground-muted">
                Max: {formatSUI(currentBalance)} SUI
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !withdrawAmount}
              className="w-full bg-card border border-border hover:bg-card-hover disabled:bg-skeleton text-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Withdraw Funds'}
            </button>
          </form>
        </div>

        {/* Transfer Admin Rights */}
        <div className="control-section border-t border-border pt-6">
          <h4 className="text-md font-medium text-foreground mb-4">Transfer Admin Rights</h4>
          <form onSubmit={handleTransferAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                New Admin Address
              </label>
              <input
                type="text"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-input-background text-foreground font-mono"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newAdminAddress}
              className="w-full bg-card border border-border hover:bg-card-hover disabled:bg-skeleton text-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Transfer Admin Rights'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;
