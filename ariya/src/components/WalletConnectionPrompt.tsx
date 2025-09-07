import { useNavigate } from "react-router-dom";
import { User,  } from "lucide-react";
import Button from "./Button";

interface WalletConnectionPromptProps {
  title: string;
  description: string;
  icon?: React.ReactElement;
}

const WalletConnectionPrompt = ({ 
  title, 
  description, 
  icon = <User className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />
}: WalletConnectionPromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {icon}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {title}
        </h2>
        <p className="text-foreground-secondary mb-6">
          {description}
        </p>
        <Button onClick={() => navigate("/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
};

export default WalletConnectionPrompt;
