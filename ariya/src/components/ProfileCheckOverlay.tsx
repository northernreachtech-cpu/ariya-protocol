import { Loader2 } from "lucide-react";

interface ProfileCheckOverlayProps {
  isVisible: boolean;
  message?: string;
}

const ProfileCheckOverlay = ({
  isVisible,
  message = "Checking your profile...",
}: ProfileCheckOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-sm mx-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">Profile Check</h3>
        <p className="text-foreground-secondary text-sm">{message}</p>
      </div>
    </div>
  );
};

export default ProfileCheckOverlay;
