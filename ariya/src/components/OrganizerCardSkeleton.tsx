import Card from "./Card";

const OrganizerCardSkeleton = () => (
  <Card className="p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-6 bg-skeleton rounded w-48 mb-2"></div>
        <div className="h-4 bg-skeleton rounded w-32"></div>
      </div>
      <div className="flex space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-skeleton rounded"></div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center">
        <div className="h-5 bg-skeleton rounded w-12 mx-auto mb-1"></div>
        <div className="h-3 bg-skeleton rounded w-16 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-5 bg-skeleton rounded w-16 mx-auto mb-1"></div>
        <div className="h-3 bg-skeleton rounded w-20 mx-auto"></div>
      </div>
      <div className="text-center">
        <div className="h-5 bg-skeleton rounded w-12 mx-auto mb-1"></div>
        <div className="h-3 bg-skeleton rounded w-16 mx-auto"></div>
      </div>
    </div>

    <div className="h-4 bg-skeleton rounded w-full mb-4"></div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-card-secondary rounded-lg p-3">
        <div className="h-3 bg-skeleton rounded w-20 mb-2"></div>
        <div className="h-5 bg-skeleton rounded w-16"></div>
      </div>
      <div className="bg-card-secondary rounded-lg p-3">
        <div className="h-3 bg-skeleton rounded w-24 mb-2"></div>
        <div className="h-5 bg-skeleton rounded w-20"></div>
      </div>
    </div>
  </Card>
);

export default OrganizerCardSkeleton;
