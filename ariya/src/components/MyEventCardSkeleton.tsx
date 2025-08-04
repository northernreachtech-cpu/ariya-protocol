import Card from "./Card";

const MyEventCardSkeleton = () => (
  <Card className="p-6 sm:p-8 animate-pulse">
    <div className="flex items-start justify-between mb-4 sm:mb-6">
      <div className="flex-1">
        <div className="h-6 bg-skeleton rounded mb-2 w-3/4"></div>
        <div className="h-5 bg-skeleton rounded w-20"></div>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-center">
        <div className="h-4 w-4 bg-skeleton rounded mr-2"></div>
        <div className="h-4 bg-skeleton rounded w-24"></div>
      </div>
      <div className="flex items-center">
        <div className="h-4 w-4 bg-skeleton rounded mr-2"></div>
        <div className="h-4 bg-skeleton rounded w-32"></div>
      </div>
    </div>

    <div className="space-y-2">
      <div className="h-8 bg-skeleton rounded"></div>
      <div className="h-8 bg-skeleton rounded"></div>
    </div>
  </Card>
);

export default MyEventCardSkeleton;
