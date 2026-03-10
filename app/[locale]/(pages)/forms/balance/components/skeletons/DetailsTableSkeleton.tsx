import Skeleton from "@/components/Skeleton";

const DetailsTableSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 mb-1.5 p-0.5">
    <div className="flex justify-between items-center mb-0.5">
      <Skeleton className="h-6 w-20 rounded-md" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <div className="overflow-x-auto mb-0.5">
      <Skeleton className="h-8 w-full rounded-md mb-0.5" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-7 w-full rounded-md mb-0.5" />
      ))}
    </div>
  </div>
);

export default DetailsTableSkeleton;
