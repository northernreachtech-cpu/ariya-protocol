const EventDetailsSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 pb-6 sm:pb-10 animate-pulse">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section Skeleton */}
        <div className="relative h-96 bg-skeleton rounded-2xl mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="h-8 bg-skeleton rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-skeleton rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-skeleton rounded w-2/3"></div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 bg-skeleton rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-skeleton rounded w-full"></div>
                <div className="h-4 bg-skeleton rounded w-3/4"></div>
                <div className="h-4 bg-skeleton rounded w-2/3"></div>
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 bg-skeleton rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-skeleton rounded mr-3"></div>
                  <div className="h-4 bg-skeleton rounded w-32"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-skeleton rounded mr-3"></div>
                  <div className="h-4 bg-skeleton rounded w-40"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-skeleton rounded mr-3"></div>
                  <div className="h-4 bg-skeleton rounded w-36"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-skeleton rounded mr-3"></div>
                  <div className="h-4 bg-skeleton rounded w-28"></div>
                </div>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 bg-skeleton rounded w-1/4 mb-4"></div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-skeleton rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-skeleton rounded w-32 mb-2"></div>
                  <div className="h-4 bg-skeleton rounded w-48"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 bg-skeleton rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-12 bg-skeleton rounded-lg"></div>
                <div className="h-12 bg-skeleton rounded-lg"></div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 bg-skeleton rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-skeleton rounded w-20"></div>
                  <div className="h-4 bg-skeleton rounded w-12"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-skeleton rounded w-24"></div>
                  <div className="h-4 bg-skeleton rounded w-16"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-skeleton rounded w-28"></div>
                  <div className="h-4 bg-skeleton rounded w-14"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EventDetailsSkeleton;
