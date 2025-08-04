import Card from "./Card";

const EventCardSkeleton = () => (
  <Card className="h-full animate-pulse">
    {/* Event Image Skeleton */}
    <div className="relative h-48 bg-skeleton rounded-t-lg overflow-hidden mb-4">
      <div className="absolute top-4 right-4">
        <div className="w-16 h-6 bg-skeleton rounded-full"></div>
      </div>
    </div>

    {/* Event Content Skeleton */}
    <div className="p-6">
      <div className="mb-4">
        {/* Title Skeleton */}
        <div className="h-6 bg-skeleton rounded mb-2 w-3/4"></div>
        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-skeleton rounded w-full"></div>
          <div className="h-4 bg-skeleton rounded w-2/3"></div>
        </div>
      </div>

      {/* Event Details Skeleton */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-skeleton rounded mr-2"></div>
          <div className="h-4 bg-skeleton rounded w-24"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-skeleton rounded mr-2"></div>
          <div className="h-4 bg-skeleton rounded w-32"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-skeleton rounded mr-2"></div>
          <div className="h-4 bg-skeleton rounded w-28"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-skeleton rounded mr-2"></div>
          <div className="h-4 bg-skeleton rounded w-20"></div>
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="h-12 bg-skeleton rounded-lg"></div>
    </div>
  </Card>
);

export default EventCardSkeleton;
