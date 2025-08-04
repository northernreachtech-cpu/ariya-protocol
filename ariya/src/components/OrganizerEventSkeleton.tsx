import Card from "./Card";

const OrganizerEventSkeleton = () => (
  <Card className="p-4 sm:p-6 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Event Info */}
      <div className="flex flex-col justify-between bg-card-secondary rounded-lg p-4 h-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="h-6 bg-skeleton rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-skeleton rounded w-1/2"></div>
          </div>
          <div className="h-5 bg-skeleton rounded w-16"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-skeleton rounded w-16"></div>
            <div className="h-4 bg-skeleton rounded w-12"></div>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-skeleton h-2 rounded-full w-1/3"></div>
          </div>
          <div className="h-3 bg-skeleton rounded w-12 mt-1"></div>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card-secondary rounded-lg p-4">
          <div className="h-4 bg-skeleton rounded w-16 mb-2"></div>
          <div className="h-6 bg-skeleton rounded w-12"></div>
        </div>
        <div className="bg-card-secondary rounded-lg p-4">
          <div className="h-4 bg-skeleton rounded w-20 mb-2"></div>
          <div className="h-6 bg-skeleton rounded w-16"></div>
        </div>
        <div className="bg-card-secondary rounded-lg p-4">
          <div className="h-4 bg-skeleton rounded w-16 mb-2"></div>
          <div className="h-6 bg-skeleton rounded w-12"></div>
        </div>
        <div className="bg-card-secondary rounded-lg p-4">
          <div className="h-4 bg-skeleton rounded w-16 mb-2"></div>
          <div className="h-6 bg-skeleton rounded w-12"></div>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-skeleton rounded flex-1"></div>
      <div className="h-8 bg-skeleton rounded flex-1"></div>
      <div className="h-8 bg-skeleton rounded flex-1"></div>
    </div>
  </Card>
);

export default OrganizerEventSkeleton;
