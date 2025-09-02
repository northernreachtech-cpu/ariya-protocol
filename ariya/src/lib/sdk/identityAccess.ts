import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";
import { keccak_256 } from "@noble/hashes/sha3";
import { bcs } from "@mysten/sui/bcs";
import { AttendanceVerificationSDK } from "./attendanceVerification";

const CLOCK_ID = "0x6";

export interface Registration {
  wallet: string;
  registered_at: number;
  pass_hash: string | Uint8Array;
  checked_in: boolean;
}

export class IdentityAccessSDK {
  private packageId: string;
  private attendanceSDK: AttendanceVerificationSDK;

  constructor(packageId: string) {
    this.packageId = packageId;
    this.attendanceSDK = new AttendanceVerificationSDK(packageId);
  }

  /**
   * Register for an event and generate QR code data
   * Returns the QR data with a short reference ID
   */
  async registerForEventAndGenerateQR(
    eventId: string,
    registrationRegistryId: string,
    organizerSubscriptionId: string,
    organizerProfileId: string,
    treasuryId: string,
    userAddress: string,
    signAndExecute: (params: { transaction: Transaction }) => Promise<unknown>,
    eventFeeAmount?: number,
    paymentCoinId?: string
  ): Promise<{ qrData: unknown; passHash: Uint8Array } | null> {
    try {
      // 1. Register for the event (free or paid)
      let registerTx: Transaction;
      
      if (eventFeeAmount && eventFeeAmount > 0 && paymentCoinId) {
        // Paid event
        registerTx = this.registerForEvent(
          eventId,
          registrationRegistryId,
          organizerSubscriptionId,
          organizerProfileId,
          treasuryId,
          paymentCoinId
        );
      } else {
        // Free event
        registerTx = this.registerForFreeEvent(
          eventId,
          registrationRegistryId,
          organizerSubscriptionId,
          organizerProfileId
        );
      }

      // Note: Enoki wallet handles zkLogin authentication automatically
      // No need to manually set sender or gas payment

      // 2. Execute the registration transaction
      console.log("🔨 Executing registration transaction...");
      console.log("👤 User address for transaction:", userAddress);
      console.log("🔍 Transaction details:", {
        eventId,
        registrationRegistryId,
        organizerSubscriptionId,
        organizerProfileId,
        treasuryId,
        eventFeeAmount,
        paymentCoinId
      });
      
      try {
        // Debug: Check wallet balance before transaction
        try {
          const balance = await suiClient.getBalance({
            owner: userAddress,
            coinType: "0x2::sui::SUI"
          });
          console.log("💰 Wallet balance before transaction:", {
            totalBalance: balance.totalBalance,
            totalBalanceInSui: Number(balance.totalBalance) / 1000000000,
            coinObjectCount: balance.coinObjectCount
          });
          
          // Get individual coins
          const { data: coins } = await suiClient.getCoins({
            owner: userAddress,
            coinType: "0x2::sui::SUI",
          });
          console.log("🪙 Individual coins:", coins.map(c => ({
            coinObjectId: c.coinObjectId,
            balance: c.balance,
            balanceInSui: Number(c.balance) / 1000000000
          })));
        } catch (balanceError) {
          console.error("❌ Error checking wallet balance:", balanceError);
        }
        
        console.log("🚀 Executing transaction with signAndExecute...");
        console.log("🔍 Transaction details:", {
          userAddress,
          transactionType: "registration"
        });
        
        // Execute the transaction - let the wallet handle gas automatically
        console.log("🔍 Final transaction check:", {
          transactionType: typeof registerTx,
          userAddress
        });
        
                // Execute the transaction - let the Move contract handle everything
        console.log("🚀 Executing transaction with signAndExecute...");
        console.log("🔍 Transaction details:", {
          userAddress,
          transactionType: "registration",
          eventFeeAmount,
          paymentCoinId
        });
        
        // Execute the transaction - let Enoki handle gas automatically
        console.log("🚀 Executing transaction with Enoki...");
        const result = await signAndExecute({ transaction: registerTx });
        console.log("✅ Transaction executed successfully:", result);
      } catch (txError) {
        console.error("❌ Transaction execution failed:", txError);
        console.error("❌ Error details:", {
          message: txError instanceof Error ? txError.message : String(txError),
          stack: txError instanceof Error ? txError.stack : undefined,
          fullError: txError
        });
        throw txError; // Re-throw to be caught by the caller
      }

      // 3. Extract pass_id from the PassGenerated event
      let pass_id: number | null = null;

      // Wait a moment for the transaction to be processed
      console.log("⏳ Waiting for transaction to be indexed...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Query recent transactions to find the PassGenerated event
      console.log("🔍 Querying for PassGenerated events...");
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "identity_access",
            function: eventFeeAmount && eventFeeAmount > 0 ? "register_for_event" : "register_for_free_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 20, // Increased limit
      });

      console.log("📋 Found transactions:", transactions.length);

      // Find the PassGenerated event for this specific user and event
      console.log("🔍 Searching for PassGenerated events...");
      for (const txn of transactions) {
        console.log("📋 Transaction:", txn.digest);
        if (txn.events) {
          console.log("📋 Events in transaction:", txn.events.length);
          for (const event of txn.events) {
            console.log("📋 Event type:", event.type);
            if (event.type?.includes("PassGenerated")) {
              console.log("🎯 Found PassGenerated event:", event.parsedJson);
              const eventData = event.parsedJson as {
                event_id: string;
                wallet: string;
                pass_id: number;
                expires_at: number;
              };

              if (
                eventData &&
                eventData.event_id === eventId &&
                eventData.wallet === userAddress
              ) {
                console.log("✅ Found matching PassGenerated event for user:", userAddress);
                pass_id = eventData.pass_id;
                break;
              }
            }
          }
        }
      }

      if (!pass_id) {
        console.error("❌ No PassGenerated event found for user:", userAddress, "and event:", eventId);
        
        // Fallback: Try to get pass_id from the transaction result directly
        console.log("🔄 Trying fallback approach...");
        try {
          // Query all recent transactions for this user
          const { data: userTransactions } = await suiClient.queryTransactionBlocks({
            filter: {
              FromAddress: userAddress,
            },
            options: {
              showEffects: true,
              showEvents: true,
              showObjectChanges: true,
            },
            limit: 5,
          });

          console.log("📋 User transactions found:", userTransactions.length);
          
          for (const txn of userTransactions) {
            if (txn.events) {
              for (const event of txn.events) {
                if (event.type?.includes("PassGenerated")) {
                  const eventData = event.parsedJson as {
                    event_id: string;
                    wallet: string;
                    pass_id: number;
                    expires_at: number;
                  };

                  if (eventData && eventData.event_id === eventId) {
                    console.log("✅ Found PassGenerated event in user transactions:", eventData);
                    pass_id = eventData.pass_id;
                    break;
                  }
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error("❌ Fallback approach also failed:", fallbackError);
        }
        
        if (!pass_id) {
          console.error("❌ Still no PassGenerated event found after fallback");
          return null;
        }
      }

      // 4. Generate the pass hash using the real pass_id
      const passHash = this.generatePassHash(
        BigInt(pass_id),
        eventId,
        userAddress
      );

      // 5. Generate QR code data with short reference ID (restore original format)
      const qrData = {
        ref: `${eventId.slice(0, 8)}${pass_id}${userAddress.slice(0, 8)}`, // Short reference
        e: eventId,
        p: pass_id,
        u: userAddress,
        t: Date.now(),
      };

      console.log("🔐 Generated QR data (restored original format):", qrData);
      console.log("📏 QR data size:", JSON.stringify(qrData).length, "bytes");

      return { qrData, passHash };
    } catch {
      return null;
    }
  }

  /**
   * After registration, call this to generate pass hash and check in
   * (You must provide the pass_id from the PassGenerated event)
   */
  checkInAfterRegistration(
    eventId: string,
    registrationRegistryId: string,
    attendanceRegistryId: string,
    userAddress: string,
    pass_id: number
  ): Transaction {
    // 2. Generate the pass hash
    const passHash = this.generatePassHash(
      BigInt(pass_id),
      eventId,
      userAddress
    );
    // 3. Prepare qrData
    const qrData = { pass_hash: passHash };
    // 4. Create the check-in transaction
    return this.attendanceSDK.checkInAttendee(
      eventId,
      userAddress,
      attendanceRegistryId,
      registrationRegistryId,
      qrData
    );
  }

  /**
   * Create the registration transaction for paid events
   */
  registerForEvent(
    eventId: string,
    registrationRegistryId: string,
    organizerSubscriptionId: string,
    organizerProfileId: string,
    treasuryId: string,
    paymentCoinId: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::identity_access::register_for_event`,
      arguments: [
        tx.object(eventId), // event: &mut Event
        tx.object(registrationRegistryId), // registry: &mut RegistrationRegistry
        tx.object(organizerSubscriptionId), // organizer_subscription: &UserSubscription
        tx.object(organizerProfileId), // organizer_profile: &OrganizerProfile
        tx.object(treasuryId), // treasury: &mut PlatformTreasury
        tx.object(paymentCoinId), // payment: Coin<SUI> - Move contract handles splitting
        tx.object(CLOCK_ID), // clock: &Clock
      ],
    });
    
    // Set gas budget for zkLogin compatibility
    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    
    return tx;
  }

  /**
   * Create the registration transaction for free events
   */
  registerForFreeEvent(
    eventId: string,
    registrationRegistryId: string,
    organizerSubscriptionId: string,
    organizerProfileId: string
  ): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::identity_access::register_for_free_event`,
      arguments: [
        tx.object(eventId), // event: &mut Event
        tx.object(registrationRegistryId), // registry: &mut RegistrationRegistry
        tx.object(organizerSubscriptionId), // organizer_subscription: &UserSubscription
        tx.object(organizerProfileId), // organizer_profile: &OrganizerProfile
        tx.object(CLOCK_ID), // clock: &Clock
      ],
    });
    
    // Set gas budget for zkLogin compatibility
    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    
    return tx;
  }

  /**
   * Generate pass hash using the same logic as the Move contract
   */
  private generatePassHash(
    passId: bigint,
    eventId: string,
    wallet: string
  ): Uint8Array {
    const passIdBytes = bcs.U64.serialize(passId).toBytes();
    const eventIdBytes = bcs.Address.serialize(eventId).toBytes();
    const walletBytes = bcs.Address.serialize(wallet).toBytes();
    const combined = new Uint8Array(
      passIdBytes.length + eventIdBytes.length + walletBytes.length
    );
    combined.set(passIdBytes, 0);
    combined.set(eventIdBytes, passIdBytes.length);
    combined.set(walletBytes, passIdBytes.length + eventIdBytes.length);
    return keccak_256(combined);
  }

  /**
   * Get registration status for a user (for UI components)
   */
  async getRegistrationStatus(
    eventId: string,
    userAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _registrationRegistryId: string
  ): Promise<Registration | null> {
    try {
      // Query for PassGenerated events to check if user is registered
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "identity_access",
            function: "register_for_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 50,
      });

      // Look for PassGenerated event for this specific user and event
      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("PassGenerated")) {
              const eventData = event.parsedJson as {
                event_id: string;
                wallet: string;
                pass_id: number;
                expires_at: number;
              };

              if (
                eventData &&
                eventData.event_id === eventId &&
                eventData.wallet === userAddress
              ) {
                // Generate the pass hash for the registration object
                const passHash = this.generatePassHash(
                  BigInt(eventData.pass_id),
                  eventId,
                  userAddress
                );
                const passHashHex = Array.from(passHash)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("");

                return {
                  wallet: userAddress,
                  registered_at: eventData.expires_at - 24 * 60 * 60 * 1000, // Approximate registration time
                  pass_hash: passHashHex,
                  checked_in: false, // Would need to check attendance separately
                };
              }
            }
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is registered for an event (using Move contract function)
   */
  async isRegistered(
    eventId: string,
    userAddress: string,
    registrationRegistryId: string
  ): Promise<boolean> {
    try {
      console.log("🔍 Checking registration via Move contract...", {
        eventId,
        userAddress,
        registrationRegistryId,
        packageId: this.packageId
      });
      
      // Use the Move contract's is_registered function
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::identity_access::is_registered`,
        arguments: [
          tx.pure.address(userAddress),
          tx.pure.id(eventId),
          tx.object(registrationRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      console.log("🔍 Contract call result:", {
        hasResult: !!result,
        hasResults: !!(result?.results),
        resultsLength: result?.results?.length || 0,
        firstResult: result?.results?.[0],
        returnValues: result?.results?.[0]?.returnValues
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const rawValue = returnVals[0];
          const isRegistered = Array.isArray(rawValue) ? rawValue[0] : rawValue;
          
          console.log("📋 Contract registration check details:", {
            rawReturnValue: rawValue,
            parsedValue: isRegistered,
            booleanResult: Boolean(isRegistered),
            type: typeof isRegistered
          });
          
          return Boolean(isRegistered);
        }
      }

      console.log("❌ Contract check failed, falling back to event query...");
      
      // Fallback to event query method
      const registration = await this.getRegistrationStatus(
        eventId,
        userAddress,
        registrationRegistryId
      );
      return registration !== null;
    } catch (error) {
      console.error("❌ Registration check failed:", error);
      return false;
    }
  }

  /**
   * Check if user is the organizer of an event
   */
  async isEventOrganizer(
    eventId: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      // Query the event to get organizer address
      const { data: objects } = await suiClient.getObject({
        id: eventId,
        options: { showContent: true },
      });

      if (objects?.content?.dataType === "moveObject") {
        const fields = objects.content.fields as { organizer: string };
        return fields.organizer === userAddress;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generate QR code data for registration
   */
  generateQRCodeData(
    eventId: string,
    userAddress: string,
    registration: Registration
  ): string {
    // Generate a compact QR code string
    const qrData = {
      event_id: eventId,
      user_address: userAddress,
      pass_hash: registration.pass_hash,
      registered_at: registration.registered_at,
    };

    return JSON.stringify(qrData);
  }

  /**
   * Parse QR code data
   */
  parseQRCodeData(qrData: string): unknown {
    try {
      return JSON.parse(qrData);
    } catch {
      return null;
    }
  }
}
