import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";

// System clock object ID is constant
const CLOCK_ID = "0x6";

export interface TreasuryStatus {
  id: string;
  balance: number;
  admin: string;
  totalPlatformFees: number;
  totalSubscriptionFees: number;
}

export interface TreasuryEvent {
  amount: number;
  timestamp: Date;
  txDigest: string;
}

export interface PlatformFeeEvent extends TreasuryEvent {
  feeType: string;
  depositor: string;
}

export interface WithdrawalEvent extends TreasuryEvent {
  admin: string;
}

export interface AdminTransferEvent {
  oldAdmin: string;
  newAdmin: string;
  timestamp: Date;
  txDigest: string;
}

export class PlatformTreasurySDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  /**
   * Get complete treasury status
   */
  async getTreasuryStatus(treasuryId: string): Promise<TreasuryStatus | null> {
    try {
      const treasury = await suiClient.getObject({
        id: treasuryId,
        options: { showContent: true },
      });

      if (!treasury.data?.content) {
        throw new Error('Treasury not found');
      }

      const fields = (treasury.data.content as any).fields;
      return {
        id: treasuryId,
        balance: parseInt(fields.balance),
        admin: fields.admin,
        totalPlatformFees: parseInt(fields.total_platform_fees),
        totalSubscriptionFees: parseInt(fields.total_subscription_fees),
      };
    } catch (error) {
      console.error('Error fetching treasury status:', error);
      return null;
    }
  }

  /**
   * Check if user is treasury admin
   */
  async isAdmin(treasuryId: string, userAddress: string): Promise<boolean> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::platform_treasury::is_admin`,
        arguments: [
          tx.object(treasuryId),
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
          const val = Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0];
          return Number(val) === 1;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get admin capability ID for a user
   */
  async getAdminCapabilityId(treasuryId: string, userAddress: string): Promise<string | null> {
    try {
      const { data: adminCaps } = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::platform_treasury::TreasuryAdminCap`,
        },
        options: { showContent: true },
      });

      // Find the capability that matches this treasury
      for (const cap of adminCaps) {
        if (cap.data?.content?.dataType === "moveObject") {
          const fields = (cap.data.content as any).fields;
          if (fields && fields.treasury_id === treasuryId) {
            return cap.data.objectId;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting admin capability:', error);
      return null;
    }
  }

  /**
   * Withdraw funds from treasury (admin only)
   */
  withdrawFunds(
    treasuryId: string,
    adminCapId: string,
    amount: number
  ): Transaction {
    const tx = new Transaction();

    const [withdrawnCoin] = tx.moveCall({
      target: `${this.packageId}::platform_treasury::withdraw_treasury_funds`,
      arguments: [
        tx.object(treasuryId),
        tx.object(adminCapId),
        tx.pure.u64(amount),
        tx.object(CLOCK_ID),
      ],
    });

    // Transfer withdrawn funds to the transaction sender
    tx.transferObjects([withdrawnCoin], tx.pure.address("0x0"));

    return tx;
  }

  /**
   * Transfer admin rights to new admin (admin only)
   */
  transferAdmin(
    treasuryId: string,
    adminCapId: string,
    newAdminAddress: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::platform_treasury::transfer_admin`,
      arguments: [
        tx.object(treasuryId),
        tx.object(adminCapId),
        tx.pure.address(newAdminAddress),
      ],
    });

    return tx;
  }

  /**
   * Get platform fee deposit history
   */
  async getFeeHistory(_treasuryId: string, limit: number = 50): Promise<PlatformFeeEvent[]> {
    try {
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::platform_treasury::PlatformFeeDeposited`,
        },
        limit,
        order: 'descending',
      });

      return events.map(event => {
        const data = event.parsedJson as any;
        return {
          amount: parseInt(data.amount),
          feeType: data.fee_type,
          depositor: data.depositor,
          timestamp: new Date(parseInt(data.timestamp)),
          txDigest: event.id.txDigest,
        };
      });
    } catch (error) {
      console.error('Error fetching fee history:', error);
      return [];
    }
  }

  /**
   * Get treasury withdrawal history
   */
  async getWithdrawalHistory(_treasuryId: string, limit: number = 50): Promise<WithdrawalEvent[]> {
    try {
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::platform_treasury::TreasuryWithdrawal`,
        },
        limit,
        order: 'descending',
      });

      return events.map(event => {
        const data = event.parsedJson as any;
        return {
          amount: parseInt(data.amount),
          admin: data.admin,
          timestamp: new Date(parseInt(data.timestamp)),
          txDigest: event.id.txDigest,
        };
      });
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      return [];
    }
  }

  /**
   * Get admin transfer history
   */
  async getAdminTransferHistory(_treasuryId: string, limit: number = 50): Promise<AdminTransferEvent[]> {
    try {
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::platform_treasury::AdminTransferred`,
        },
        limit,
        order: 'descending',
      });

      return events.map(event => {
        const data = event.parsedJson as any;
        return {
          oldAdmin: data.old_admin,
          newAdmin: data.new_admin,
          timestamp: new Date(parseInt(data.timestamp)),
          txDigest: event.id.txDigest,
        };
      });
    } catch (error) {
      console.error('Error fetching admin transfer history:', error);
      return [];
    }
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(treasuryId: string): Promise<number> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::platform_treasury::get_treasury_balance`,
        arguments: [tx.object(treasuryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const val = Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0];
          return parseInt(String(val));
        }
      }

      return 0;
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      return 0;
    }
  }

  /**
   * Get treasury admin address
   */
  async getTreasuryAdmin(treasuryId: string): Promise<string | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::platform_treasury::get_treasury_admin`,
        arguments: [tx.object(treasuryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const val = Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0];
          return String(val);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting treasury admin:', error);
      return null;
    }
  }

  /**
   * Get fee totals
   */
  async getFeeTotals(treasuryId: string): Promise<{ platformFees: number; subscriptionFees: number }> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::platform_treasury::get_fee_totals`,
        arguments: [tx.object(treasuryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 2) {
          const val0 = Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0];
          const val1 = Array.isArray(returnVals[1]) ? returnVals[1][0] : returnVals[1];
          return {
            platformFees: parseInt(String(val0)),
            subscriptionFees: parseInt(String(val1)),
          };
        }
      }

      return { platformFees: 0, subscriptionFees: 0 };
    } catch (error) {
      console.error('Error getting fee totals:', error);
      return { platformFees: 0, subscriptionFees: 0 };
    }
  }
}
