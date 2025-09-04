import React, { useState, useEffect } from 'react';
import { useAriyaSDK, type PlatformFeeEvent, type WithdrawalEvent, type AdminTransferEvent } from '../lib/sdk';
import { useNetworkVariable } from '../config/sui';

interface TreasuryHistoryProps {
  treasuryId: string;
}

type HistoryTab = 'fees' | 'withdrawals' | 'transfers';

const TreasuryHistory: React.FC<TreasuryHistoryProps> = ({ treasuryId }) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('fees');
  const [feeHistory, setFeeHistory] = useState<PlatformFeeEvent[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalEvent[]>([]);
  const [transferHistory, setTransferHistory] = useState<AdminTransferEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const sdk = useAriyaSDK();
  const platformTreasuryId = useNetworkVariable('platformTreasuryId');

  const formatSUI = (amount: number) => {
    return (amount / 1e9).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [fees, withdrawals, transfers] = await Promise.all([
        sdk.platformTreasury.getFeeHistory(platformTreasuryId, 50),
        sdk.platformTreasury.getWithdrawalHistory(platformTreasuryId, 50),
        sdk.platformTreasury.getAdminTransferHistory(platformTreasuryId, 50),
      ]);

      setFeeHistory(fees);
      setWithdrawalHistory(withdrawals);
      setTransferHistory(transfers);
    } catch (error) {
      console.error('Error loading treasury history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [treasuryId]);

  const tabs = [
    { id: 'fees' as HistoryTab, label: 'Fee Deposits', count: feeHistory.length },
    { id: 'withdrawals' as HistoryTab, label: 'Withdrawals', count: withdrawalHistory.length },
    { id: 'transfers' as HistoryTab, label: 'Admin Transfers', count: transferHistory.length },
  ];

  const renderFeeHistory = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-card-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Transaction
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {feeHistory.map((record, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {record.timestamp.toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {formatSUI(record.amount)} SUI
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  record.feeType === 'event_registration' 
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/20 text-secondary'
                }`}>
                  {record.feeType.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                {formatAddress(record.depositor)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-secondary">
                <a
                  href={`https://suiscan.xyz/mainnet/tx/${record.txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWithdrawalHistory = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-card-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Admin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Transaction
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {withdrawalHistory.map((record, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {record.timestamp.toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {formatSUI(record.amount)} SUI
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                {formatAddress(record.admin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-secondary">
                <a
                  href={`https://suiscan.xyz/mainnet/tx/${record.txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTransferHistory = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-card-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
              Transaction
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {transferHistory.map((record, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {record.timestamp.toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                {formatAddress(record.oldAdmin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                {formatAddress(record.newAdmin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-secondary">
                <a
                  href={`https://suiscan.xyz/mainnet/tx/${record.txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="treasury-history bg-card rounded-lg shadow-sm border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Treasury History</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-card border border-border text-foreground-secondary py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'fees' && renderFeeHistory()}
            {activeTab === 'withdrawals' && renderWithdrawalHistory()}
            {activeTab === 'transfers' && renderTransferHistory()}
          </>
        )}

        {/* Empty state */}
        {!loading && (
          <>
            {activeTab === 'fees' && feeHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-foreground-muted">No fee deposits found</p>
              </div>
            )}
            {activeTab === 'withdrawals' && withdrawalHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-foreground-muted">No withdrawals found</p>
              </div>
            )}
            {activeTab === 'transfers' && transferHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-foreground-muted">No admin transfers found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TreasuryHistory;
