import Card from "./Card";

const CommunityCardSkeleton = () => (
  <Card className="p-6 flex flex-col justify-between animate-pulse">
    <div>
      <div className="flex items-start justify-between mb-2">
        <div className="h-6 bg-skeleton rounded w-48"></div>
        <div className="w-5 h-5 bg-skeleton rounded"></div>
      </div>
      <div className="h-4 bg-skeleton rounded w-full mb-2"></div>
      <div className="space-y-1 mb-2">
        <div className="h-3 bg-skeleton rounded w-32"></div>
        <div className="h-3 bg-skeleton rounded w-40"></div>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg mb-3">
        <div className="w-4 h-4 bg-skeleton rounded"></div>
        <div className="h-3 bg-skeleton rounded w-48"></div>
      </div>
    </div>
    <div className="mt-4">
      <div className="h-10 bg-skeleton rounded-lg"></div>
    </div>
  </Card>
);

export default CommunityCardSkeleton;
