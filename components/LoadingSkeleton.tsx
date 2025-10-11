/**
 * LoadingSkeleton Component
 * Provides a skeleton UI for better perceived performance during page transitions
 */

const LoadingSkeleton = () => {
  return (
    <div className="responsive-container font-cairo animate-pulse">
      {/* Page Title Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-1/3"></div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Table/Content Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <div key={row} className="grid grid-cols-4 gap-4 mb-3">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center gap-2 mt-6">
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;

