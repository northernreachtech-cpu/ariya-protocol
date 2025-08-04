import { Gift, Users, Clock, CheckCircle } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

interface AirdropDisplayProps {
  eventId: string;
  userAddress?: string;
  onClaim?: (airdropId: string) => void;
}

const AirdropDisplay = ({
  eventId,
  userAddress,
  onClaim,
}: AirdropDisplayProps) => {
  // Mock data for demonstration
  const airdrops = [
    {
      id: "airdrop-1",
      name: "Post-Event Reward",
      description: "Thank you for attending our amazing event!",
      amount: "0.05 SUI",
      eligible: true,
      claimed: false,
    },
    {
      id: "airdrop-2",
      name: "Completion Bonus",
      description: "Extra reward for completing the full event",
      amount: "0.1 SUI",
      eligible: false,
      claimed: false,
    },
  ];

  const handleClaim = (airdropId: string) => {
    if (onClaim) {
      onClaim(airdropId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Available Rewards ({airdrops.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {airdrops.map((airdrop) => (
          <Card key={airdrop.id} className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {airdrop.name}
                </h4>
                <p className="text-foreground-secondary text-sm">
                  {airdrop.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">
                  {airdrop.amount}
                </div>

                {userAddress && (
                  <div className="flex items-center gap-2">
                    {airdrop.eligible ? (
                      airdrop.claimed ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Claimed</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(airdrop.id)}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          Claim Reward
                        </Button>
                      )
                    ) : (
                      <div className="text-sm text-foreground-muted">
                        Not eligible
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AirdropDisplay;
