/**
 * Utility functions for parsing Move abort errors into user-friendly messages
 */

// Map of error codes to user-friendly messages
const ERROR_MESSAGES: Record<number, string> = {
  // Event Management errors
  1: "You are not authorized to perform this action.", // ENotOrganizer
  2: "This event is not currently active.", // EEventNotActive
  3: "This event has already been completed.", // EEventAlreadyCompleted
  4: "Invalid event capacity. Please check your input.", // EInvalidCapacity
  5: "Invalid timestamp. Please check your date and time.", // EInvalidTimestamp
  6: "You are not authorized to perform this action.", // ENotAuthorized
  7: "Event not found. Please try again.", // EEventNotFound
  8: "This X (Twitter) username is already taken. Please choose a different username.", // EXUsernameTaken
  9: "This Telegram username is already taken. Please choose a different username.", // ETelegramUsernameTaken
  10: "X (Twitter) username not found. Please check your username and try again.", // EXUsernameNotFound
  11: "Telegram username not found. Please check your username and try again.", // ETelegramUsernameNotFound

  // Community Access errors
  12: "Community not found. Please try again.", // ECommunityNotFound
  13: "You are already a member of this community.", // EAlreadyMember
  14: "You do not meet the requirements to join this community.", // ENotEligible
  15: "Access denied for this operation.", // EAccessDenied
  16: "This community is not currently active.", // ECommunityNotActive
  17: "A community already exists for this event.", // EAlreadyExists

  // Attendance Verification errors
  18: "Invalid pass provided for check-in.", // EInvalidPass
  19: "You have already checked in to this event.", // EAlreadyCheckedIn
  20: "Check-in period has expired.", // ECheckInExpired
  21: "You are not registered for this event.", // ENotRegistered

  // NFT Minting errors
  22: "NFT minting failed. Please try again.", // EMintFailed
  23: "You do not have the required NFT for this action.", // ENoRequiredNFT
  24: "NFT transfer failed. Please try again.", // ETransferFailed

  // Escrow Settlement errors
  25: "Escrow settlement failed. Please try again.", // ESettlementFailed
  26: "Insufficient funds in escrow.", // EInsufficientFunds
  27: "Settlement period has not started yet.", // ESettlementNotStarted
  28: "Settlement period has expired.", // ESettlementExpired

  // Rating Reputation errors
  29: "Rating submission failed. Please try again.", // ERatingFailed
  30: "You have already rated this event.", // EAlreadyRated
  31: "Rating period has expired.", // ERatingExpired
  32: "Invalid rating value. Please provide a rating between 1 and 5.", // EInvalidRating

  // Subscription errors
  33: "Subscription creation failed. Please try again.", // ESubscriptionFailed
  34: "You already have an active subscription.", // EAlreadySubscribed
  35: "Subscription not found.", // ESubscriptionNotFound
  36: "Subscription has expired.", // ESubscriptionExpired
};

/**
 * Parse Move abort errors into user-friendly messages
 * @param error - The error object from the transaction
 * @returns User-friendly error message
 */
export const parseMoveAbortError = (error: any): string => {
  try {
    const errorString = error?.message || error?.toString() || "";
    
    // Extract error code from MoveAbort pattern - updated to match actual format
    const moveAbortMatch = errorString.match(/MoveAbort\([^}]+},\s*(\d+)\)/);
    
    if (moveAbortMatch) {
      const errorCode = parseInt(moveAbortMatch[1]);
      
      // Return specific message if available, otherwise generic message
      if (ERROR_MESSAGES[errorCode]) {
        return ERROR_MESSAGES[errorCode];
      }
      
      return `Transaction failed with error code ${errorCode}. Please try again.`;
    }
    
    // If no MoveAbort pattern found, return generic message
    return "Transaction failed. Please try again.";
  } catch (e) {
    return "Transaction failed. Please try again.";
  }
};

/**
 * Parse general transaction errors into user-friendly messages
 * @param error - The error object from the transaction
 * @returns User-friendly error message
 */
export const parseTransactionError = (error: any): string => {
  try {
    const errorString = error?.message || error?.toString() || "";
    
    // Check for common error patterns
    if (errorString.includes("insufficient gas")) {
      return "Insufficient gas to complete the transaction. Please try again.";
    }
    
    if (errorString.includes("user rejected")) {
      return "Transaction was cancelled by user.";
    }
    
    if (errorString.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }
    
    if (errorString.includes("timeout")) {
      return "Transaction timed out. Please try again.";
    }
    
    // Try to parse as Move abort error
    const moveAbortError = parseMoveAbortError(error);
    if (moveAbortError !== "Transaction failed. Please try again.") {
      return moveAbortError;
    }
    
    // Return generic message for unknown errors
    return "Transaction failed. Please try again.";
  } catch (e) {
    return "Transaction failed. Please try again.";
  }
};
