// import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";
import { extractMoveObjectFields } from "../../utils/extractors";

// Types based on Move module documentation
export interface UserSubscription {
  id: string;
  user: string;
  subscription_type: number;
  start_date: number;
  end_date: number;
  is_active: boolean;
  created_at: number;
  last_updated: number;
}

export interface SubscriptionConfig {
  id: string;
  basic_monthly_price: number;
  basic_yearly_price: number;
  pro_monthly_price: number;
  pro_yearly_price: number;
  admin: string;
}

export interface SubscriptionRegistry {
  id: string;
  user_subscriptions: { [key: string]: string }; // address -> subscription_id
  active_subscriptions_count: { [key: number]: number }; // subscription_type -> count
}

// Subscription types
export const SUBSCRIPTION_TYPES = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
} as const;

export class SubscriptionSDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  /**
   * Get user subscription ID from registry
   */
  async getUserSubscriptionId(
    registryId: string,
    userAddress: string
  ): Promise<string | null> {
    try {
      const registry = await suiClient.getObject({
        id: registryId,
        options: {
          showContent: true,
        },
      });

      if (!registry.data?.content || registry.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = registry.data.content.fields as {
        user_subscriptions: { [key: string]: string };
      };
      const userSubscriptions = fields.user_subscriptions;

      // Check if user has a subscription
      if (userSubscriptions && userSubscriptions[userAddress]) {
        return userSubscriptions[userAddress];
      }

      return null;
    } catch (error) {
      console.error("Error getting user subscription ID:", error);
      return null;
    }
  }

  /**
   * Get user subscription details
   */
  async getUserSubscription(subscriptionId: string): Promise<UserSubscription | null> {
    try {
      const subscription = await suiClient.getObject({
        id: subscriptionId,
        options: {
          showContent: true,
        },
      });

      if (!subscription.data?.content || subscription.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = extractMoveObjectFields(subscription.data.content);
      
      if (!fields) {
        return null;
      }
      
      return {
        id: fields.id,
        user: fields.user,
        subscription_type: parseInt(fields.subscription_type),
        start_date: parseInt(fields.start_date),
        end_date: parseInt(fields.end_date),
        is_active: fields.is_active,
        created_at: parseInt(fields.created_at),
        last_updated: parseInt(fields.last_updated),
      };
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return null;
    }
  }

  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(
    registryId: string,
    userAddress: string
  ): Promise<boolean> {
    const subscriptionId = await this.getUserSubscriptionId(registryId, userAddress);
    if (!subscriptionId) {
      return false;
    }

    const subscription = await this.getUserSubscription(subscriptionId);
    return subscription?.is_active || false;
  }

  /**
   * Get subscription type name
   */
  getSubscriptionTypeName(subscriptionType: number): string {
    switch (subscriptionType) {
      case SUBSCRIPTION_TYPES.FREE:
        return "Free";
      case SUBSCRIPTION_TYPES.BASIC:
        return "Basic";
      case SUBSCRIPTION_TYPES.PRO:
        return "Pro";
      default:
        return "Unknown";
    }
  }
}
