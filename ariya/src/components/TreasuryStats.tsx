import React from 'react';
import { type TreasuryStatus } from '../lib/sdk';

interface TreasuryStatsProps {
  treasuryData: TreasuryStatus;
  isAdmin: boolean;
}

const TreasuryStats: React.FC<TreasuryStatsProps> = ({ treasuryData, isAdmin }) => {
  const formatSUI = (amount: number) => {
    return (amount / 1e9).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="treasury-stats">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Total Balance</p>
              <p className="text-2xl font-bold text-foreground">
                {formatSUI(treasuryData.balance)} SUI
              </p>
            </div>
            <div className="p-3 bg-success/20 rounded-full">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Platform Fees */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Platform Fees</p>
              <p className="text-2xl font-bold text-foreground">
                {formatSUI(treasuryData.totalPlatformFees)} SUI
              </p>
            </div>
            <div className="p-3 bg-primary/20 rounded-full">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subscription Fees */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Subscription Fees</p>
              <p className="text-2xl font-bold text-foreground">
                {formatSUI(treasuryData.totalSubscriptionFees)} SUI
              </p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-full">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Treasury Admin</p>
              <p className="text-sm font-mono text-foreground">
                {formatAddress(treasuryData.admin)}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success mt-2">
                  You are the admin
                </span>
              )}
            </div>
            <div className="p-3 bg-accent/20 rounded-full">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryStats;
