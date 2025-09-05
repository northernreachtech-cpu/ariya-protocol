import { useState, useEffect } from "react";

import {
  Gift,
  TrendingUp,
  Users,
  DollarSign,
  
  BarChart3,
} from "lucide-react";
import Card from "./Card";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";

interface AirdropAnalyticsProps {
  organizerAddress: string;
}

interface AnalyticsData {
  totalAirdrops: number;
  totalDistributed: number;
  totalRecipients: number;
  averageClaimRate: number;
  distributionByType: {
    equal: number;
    weighted: number;
    bonus: number;
  };
  monthlyTrends: Array<{
    month: string;
    airdrops: number;
    distributed: number;
  }>;
}

const AirdropAnalytics = ({ organizerAddress }: AirdropAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sdk = useAriyaSDK();
  const airdropRegistryId = useNetworkVariable('airdropRegistryId');
  const eventRegistryId = useNetworkVariable('eventRegistryId');

  const loadAnalytics = async () => {
    if (!organizerAddress || !airdropRegistryId || !eventRegistryId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all events organized by this user
      const events = await sdk.eventManagement.getEventsByOrganizer(organizerAddress, eventRegistryId);
      
      const analyticsData: AnalyticsData = {
        totalAirdrops: 0,
        totalDistributed: 0,
        totalRecipients: 0,
        averageClaimRate: 0,
        distributionByType: { equal: 0, weighted: 0, bonus: 0 },
        monthlyTrends: [],
      };

      // Process each event's airdrops
      for (const event of events) {
        const airdropIds = await sdk.airdropDistribution.getEventAirdropsData(event.id, airdropRegistryId);
        
        for (const airdropId of airdropIds) {
          const details = await sdk.airdropDistribution.getAirdropDetailsData(airdropId, airdropRegistryId);
          
          if (details) {
            analyticsData.totalAirdrops++;
            analyticsData.totalDistributed += (details.poolBalance - details.poolBalance); // This would need actual calculation
            analyticsData.totalRecipients += details.claimedCount;
            
            // Track distribution types
            if (details.distributionType === 0) analyticsData.distributionByType.equal++;
            else if (details.distributionType === 1) analyticsData.distributionByType.weighted++;
            else if (details.distributionType === 2) analyticsData.distributionByType.bonus++;
          }
        }
      }

      analyticsData.averageClaimRate = analyticsData.totalRecipients / Math.max(analyticsData.totalAirdrops, 1);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading airdrop analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [organizerAddress, airdropRegistryId, eventRegistryId]);

  const formatSUI = (amount: number) => {
    return (amount / 1000000000).toFixed(3);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Airdrop Analytics</h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Airdrop Analytics</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-foreground-muted">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-primary hover:text-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Airdrop Analytics</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Total Airdrops</p>
              <p className="text-2xl font-bold text-foreground">{analytics.totalAirdrops}</p>
            </div>
            <div className="p-3 bg-primary/20 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Total Distributed</p>
              <p className="text-2xl font-bold text-foreground">{formatSUI(analytics.totalDistributed)} SUI</p>
            </div>
            <div className="p-3 bg-success/20 rounded-full">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Total Recipients</p>
              <p className="text-2xl font-bold text-foreground">{analytics.totalRecipients}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-full">
              <Users className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Avg Claim Rate</p>
              <p className="text-2xl font-bold text-foreground">{formatPercentage(analytics.averageClaimRate)}%</p>
            </div>
            <div className="p-3 bg-accent/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution Types */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 text-foreground">Distribution Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-primary mb-2">{analytics.distributionByType.equal}</div>
            <div className="text-sm text-foreground-secondary">Equal Distribution</div>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-secondary mb-2">{analytics.distributionByType.weighted}</div>
            <div className="text-sm text-foreground-secondary">Duration Weighted</div>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-accent mb-2">{analytics.distributionByType.bonus}</div>
            <div className="text-sm text-foreground-secondary">Completion Bonus</div>
          </div>
        </div>
      </Card>

      {/* Performance Summary */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 text-foreground">Performance Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Airdrops Created</span>
            <span className="font-medium text-foreground">{analytics.totalAirdrops}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Total Rewards Distributed</span>
            <span className="font-medium text-foreground">{formatSUI(analytics.totalDistributed)} SUI</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Unique Recipients</span>
            <span className="font-medium text-foreground">{analytics.totalRecipients}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Average Claim Rate</span>
            <span className="font-medium text-foreground">{formatPercentage(analytics.averageClaimRate)}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AirdropAnalytics;
