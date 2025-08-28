import { Transaction } from "@mysten/sui/transactions";
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

export interface SubscriptionPricing {
  basicMonthly: number;
  basicYearly: number;
  proMonthly: number;
  proYearly: number;
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

      const fields = registry.data.content.fields as any;
      const userSubscriptions = fields.user_subscriptions;

      // Check if user_subscriptions is a Table object
      if (userSubscriptions && typeof userSubscriptions === 'object') {
        // Since the table has size "1" but empty fields, we need to use a different approach
        // Let's try to get the table data using a Move call
        try {
          const tx = new Transaction();
          tx.moveCall({
            target: `${this.packageId}::subscription::get_user_subscription_id`,
            arguments: [
              tx.object(registryId),
              tx.pure.address(userAddress),
            ],
          });

          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
          });

          if (result && result.results && result.results.length > 0) {
            const returnVals = result.results[0].returnValues;
            if (Array.isArray(returnVals) && returnVals.length > 0) {
              // The return value is a tuple [Array(32), '0x2::object::ID']
              // We need to extract the ID from the first element
              const subscriptionIdTuple = returnVals[0];
              
              if (Array.isArray(subscriptionIdTuple) && subscriptionIdTuple.length === 2) {
                // Convert the byte array to hex string
                const byteArray = subscriptionIdTuple[0];
                if (Array.isArray(byteArray) && byteArray.length === 32) {
                  const subscriptionId = '0x' + byteArray.map(byte => 
                    byte.toString(16).padStart(2, '0')
                  ).join('');
                  return subscriptionId;
                }
              }
            }
          }
        } catch (moveError) {
          // Move call failed, continue with fallback
        }
        
        // Fallback: Check if it's a Table with fields structure
        if (userSubscriptions.fields && userSubscriptions.fields[userAddress]) {
          return userSubscriptions.fields[userAddress];
        }
        
        // Try direct key access
        if (userSubscriptions[userAddress]) {
          return userSubscriptions[userAddress];
        }
      }

      return null;
    } catch (error) {
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

      // Extract fields directly from the subscription object
      const fields = subscription.data.content.fields as any;
      
      if (!fields) {
        return null;
      }

      // Check if all required fields exist
      const requiredFields = ['id', 'user', 'subscription_type', 'start_date', 'end_date', 'is_active', 'created_at', 'last_updated'];
      for (const field of requiredFields) {
        if (fields[field] === undefined || fields[field] === null) {
          return null;
        }
      }
      
      const subscriptionData = {
        id: fields.id,
        user: fields.user,
        subscription_type: parseInt(fields.subscription_type),
        start_date: parseInt(fields.start_date),
        end_date: parseInt(fields.end_date),
        is_active: fields.is_active,
        created_at: parseInt(fields.created_at),
        last_updated: parseInt(fields.last_updated),
      };

      return subscriptionData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get subscription configuration and pricing
   */
  async getSubscriptionPricing(configId: string): Promise<SubscriptionPricing | null> {
    try {
      const config = await suiClient.getObject({
        id: configId,
        options: {
          showContent: true,
        },
      });

      if (!config.data?.content || config.data.content.dataType !== "moveObject") {
        return null;
      }

      // Try direct field access first
      const directFields = config.data.content.fields;
      
      // Try extractor as fallback
      const extractedFields = extractMoveObjectFields(config.data.content);
      
      const fields = (directFields || extractedFields) as any;
      
      if (!fields) {
        return null;
      }

      // Check if all required fields exist
      const requiredFields = ['basic_monthly_price', 'basic_yearly_price', 'pro_monthly_price', 'pro_yearly_price'];
      for (const field of requiredFields) {
        if (!fields[field]) {
          return null;
        }
      }

      const pricing = {
        basicMonthly: parseInt(fields.basic_monthly_price) / 1e9, // Convert MIST to SUI
        basicYearly: parseInt(fields.basic_yearly_price) / 1e9,
        proMonthly: parseInt(fields.pro_monthly_price) / 1e9,
        proYearly: parseInt(fields.pro_yearly_price) / 1e9,
      };

      return pricing;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user can add attendees based on subscription limits
   */
  async canAddAttendees(
    subscriptionId: string,
    organizerProfileId: string,
    additionalAttendees: number,
    userAddress: string
  ): Promise<boolean> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::subscription::can_add_attendees`,
        arguments: [
          tx.object(subscriptionId),
          tx.object(organizerProfileId),
          tx.pure.u64(additionalAttendees),
          tx.object("0x6"), // Clock ID
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues as any;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          return Array.isArray(returnVals[0]) ? returnVals[0][0] === 1 : returnVals[0] === 1;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get remaining attendee capacity for free tier
   */
  async getRemainingAttendees(
    subscriptionId: string,
    organizerProfileId: string,
    userAddress: string
  ): Promise<number | 'unlimited'> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::subscription::get_remaining_attendees`,
        arguments: [
          tx.object(subscriptionId),
          tx.object(organizerProfileId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues as any;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const remaining = Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0];
          return remaining === '18446744073709551615' ? 'unlimited' : parseInt(remaining);
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if user should pay platform fees
   */
  async shouldPayPlatformFee(subscriptionId: string, userAddress: string): Promise<boolean> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::subscription::should_pay_platform_fee`,
        arguments: [
          tx.object(subscriptionId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues as any;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          return Array.isArray(returnVals[0]) ? returnVals[0][0] === 1 : returnVals[0] === 1;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create free subscription transaction
   */
  createFreeSubscription(
    userAddress: string,
    registryId: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::subscription::create_free_subscription`,
      arguments: [
        tx.pure.address(userAddress),
        tx.object("0x6"), // Clock ID
        tx.object(registryId),
      ],
    });

    return tx;
  }

  /**
   * Subscribe to Basic plan transaction
   */
  subscribeBasic(
    subscriptionId: string,
    isYearly: boolean,
    paymentCoinId: string,
    configId: string,
    registryId: string,
    treasuryId: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::subscription::subscribe_basic`,
      arguments: [
        tx.object(subscriptionId),
        tx.pure.bool(isYearly),
        tx.object(paymentCoinId),
        tx.object(configId),
        tx.object(registryId),
        tx.object(treasuryId),
        tx.object("0x6"), // Clock ID
      ],
    });

    return tx;
  }

  /**
   * Subscribe to Pro plan transaction
   */
  subscribePro(
    subscriptionId: string,
    isYearly: boolean,
    paymentCoinId: string,
    configId: string,
    registryId: string,
    treasuryId: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::subscription::subscribe_pro`,
      arguments: [
        tx.object(subscriptionId),
        tx.pure.bool(isYearly),
        tx.object(paymentCoinId),
        tx.object(configId),
        tx.object(registryId),
        tx.object(treasuryId),
        tx.object("0x6"), // Clock ID
      ],
    });

    return tx;
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

  /**
   * Get subscription benefits description
   */
  getSubscriptionBenefits(subscriptionType: number): string[] {
    switch (subscriptionType) {
      case SUBSCRIPTION_TYPES.FREE:
        return [
          "Up to 501 total attendees",
          "Basic event management",
          "Platform fees apply (5%)"
        ];
      case SUBSCRIPTION_TYPES.BASIC:
        return [
          "Unlimited attendees",
          "Advanced features",
          "Platform fees apply (3%)",
          "Priority support"
        ];
      case SUBSCRIPTION_TYPES.PRO:
        return [
          "Unlimited attendees",
          "All premium features",
          "No platform fees",
          "Priority support",
          "Advanced analytics"
        ];
      default:
        return [];
    }
  }
}


