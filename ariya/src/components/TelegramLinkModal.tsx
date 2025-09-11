import { useState, useEffect } from "react";
import { TelegramService } from "../lib/firebase";
import Button from "./Button";
import Card from "./Card";

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  preFilledUsername?: string;
}

const TelegramLinkModal = ({ isOpen, onClose, userId, onSuccess, preFilledUsername }: TelegramLinkModalProps) => {
  const [telegramHandle, setTelegramHandle] = useState(preFilledUsername || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"handle" | "verify">("handle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update state when preFilledUsername changes
  useEffect(() => {
    if (preFilledUsername) {
      setTelegramHandle(preFilledUsername);
      // Always start with handle step, even with pre-filled username
      setStep("handle");
    } else {
      setTelegramHandle("");
      setStep("handle");
    }
  }, [preFilledUsername]);

  // Reset modal state when closed
  const handleClose = () => {
    setTelegramHandle(preFilledUsername || "");
    setVerificationCode("");
    setStep("handle"); // Always reset to handle step
    setLoading(false);
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSubmitHandle = async () => {
    if (!telegramHandle.trim()) {
      setError("Please enter your Telegram handle");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Generate and store verification code
      const code = TelegramService.generateVerificationCode();
      await TelegramService.storeVerificationCode(userId, code, telegramHandle);
      
      // Move to verification step with instructions
      setStep("verify");
      setSuccess(`Verification code generated! Please follow these steps:`);
    } catch (error) {
      setError("Failed to generate verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const handle = telegramHandle.startsWith("@") ? telegramHandle : `@${telegramHandle}`;
      const verified = await TelegramService.verifyAndLinkAccount(userId, verificationCode, handle);
      
      if (verified) {
        setSuccess("Telegram account linked successfully!");
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError("Invalid or expired verification code. Please try again.");
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <Card className="max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            Link Telegram Account
          </h3>
          <button
            onClick={handleClose}
            className="text-foreground-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {step === "handle" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telegram Handle
              </label>
              <input
                type="text"
                placeholder="@username"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
                disabled={loading}
              />
              <p className="text-xs text-foreground-secondary mt-1">
                Make sure you've started a chat with the Ariya bot first
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            {success && (
              <div className="text-green-500 text-sm">{success}</div>
            )}

            <Button
              onClick={handleSubmitHandle}
              disabled={loading || !telegramHandle.trim()}
              className="w-full"
            >
              {loading ? "Generating Code..." : "Generate Verification Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Follow these steps:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click the link below to open Telegram and start a chat with the Ariya bot</li>
                <li>Send this command: <code className="bg-blue-100 px-1 rounded">/verify {telegramHandle}</code></li>
                <li>The bot will send you a verification code</li>
                <li>Enter the code below</li>
              </ol>
              <div className="mt-3">
                <a
                  href={`https://t.me/ariyaprotocol_bot?start=verify_${telegramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Open Ariya Bot Chat
                </a>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 outline-none text-center text-lg font-mono"
                disabled={loading}
                maxLength={6}
              />
              <p className="text-xs text-foreground-secondary mt-1">
                Enter the code you received from the bot
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            {success && (
              <div className="text-green-500 text-sm">{success}</div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("handle")}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || !verificationCode.trim()}
                className="flex-1"
              >
                {loading ? "Verifying..." : "Verify & Link"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-card-secondary rounded-lg">
          <h4 className="font-medium text-foreground mb-2">How it works:</h4>
          <ol className="text-sm text-foreground-secondary space-y-1">
            <li>1. Enter your Telegram username above</li>
            <li>2. Click "Generate Code" to get a verification code</li>
            <li>3. Click "Open Ariya Bot Chat" to start a chat with the bot</li>
            <li>4. Send the command: <code>/verify your_username</code></li>
            <li>5. The bot will send you the verification code</li>
            <li>6. Enter the code in the app to complete linking</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default TelegramLinkModal;
