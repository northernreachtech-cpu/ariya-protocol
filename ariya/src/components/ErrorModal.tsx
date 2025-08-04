import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import Button from "./Button";
import { useState } from "react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  error?: Error | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

const ErrorModal = ({
  isOpen,
  onClose,
  title = "Something went wrong",
  message,
  error,
  onRetry,
  showDetails = false,
}: ErrorModalProps) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes("Insufficient SUI balance")) {
      return {
        icon: "💰",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
        title: "Insufficient Balance",
        suggestion:
          "Please ensure you have enough SUI tokens in your wallet to create this airdrop.",
      };
    }
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      return {
        icon: "🌐",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        title: "Network Error",
        suggestion: "Please check your internet connection and try again.",
      };
    }
    if (
      errorMessage.includes("permission") ||
      errorMessage.includes("unauthorized")
    ) {
      return {
        icon: "🔒",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        title: "Permission Error",
        suggestion: "You don't have permission to perform this action.",
      };
    }
    return {
      icon: "⚠️",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      title: "Error",
      suggestion: "An unexpected error occurred. Please try again.",
    };
  };

  const errorType = getErrorType(message);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div
              className={`flex items-center gap-3 p-6 ${errorType.bgColor} ${errorType.borderColor} border-b`}
            >
              <div className={`text-2xl ${errorType.color}`}>
                {errorType.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground font-livvic">
                  {errorType.title}
                </h3>
                <p className="text-sm text-foreground-secondary mt-1">
                  {errorType.suggestion}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-foreground text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Error Details (if available and showDetails is true) */}
              {showDetails && error && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="flex items-center gap-2 text-xs text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {showErrorDetails ? "Hide" : "Show"} technical details
                  </button>

                  {showErrorDetails && (
                    <div className="mt-2 p-3 bg-background border border-border rounded-lg">
                      <pre className="text-xs text-foreground-muted overflow-x-auto whitespace-pre-wrap">
                        {error.stack || error.message}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {onRetry && (
                  <Button onClick={onRetry} className="flex-1" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              {/* Additional Help */}
              {errorType.title === "Insufficient Balance" && (
                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-300">
                      <p className="font-medium mb-1">Need SUI tokens?</p>
                      <p>
                        You can get test SUI from the Sui Faucet or transfer
                        from another wallet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ErrorModal;
