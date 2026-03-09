import Skeleton from "@/components/Skeleton";

const TotalBalanceSkeleton = () => (
  <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
    <div className="flex flex-wrap items-center justify-between gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export default TotalBalanceSkeleton;
