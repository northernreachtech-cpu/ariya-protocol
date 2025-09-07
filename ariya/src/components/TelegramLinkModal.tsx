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
  const [step, setStep] = useState<"handle" | "verify">(preFilledUsername ? "verify" : "handle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update state when preFilledUsername changes
  useEffect(() => {
    if (preFilledUsername) {
      setTelegramHandle(preFilledUsername);
      setStep("verify");
    } else {
      setTelegramHandle("");
      setStep("handle");
    }
  }, [preFilledUsername]);

  // Reset modal state when closed
  const handleClose = () => {
    setTelegramHandle(preFilledUsername || "");
    setVerificationCode("");
    setStep(preFilledUsername ? "verify" : "handle");
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
                <li>Open Telegram and search for your Ariya bot</li>
                <li>Start a chat with the bot</li>
                <li>Send this command: <code className="bg-blue-100 px-1 rounded">/verify {telegramHandle}</code></li>
                <li>The bot will send you a verification code</li>
                <li>Enter the code below</li>
              </ol>
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
            <li>3. Open Telegram and start a chat with your Ariya bot</li>
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
