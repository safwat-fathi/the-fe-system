import Skeleton from "@/components/Skeleton";

const BalanceInfoSkeleton = () => (
  <div className="p-1 bg-white rounded-lg border border-slate-200 mb-1.5 grid grid-cols-1 md:grid-cols-12 gap-1.5">
    <div className="flex flex-col gap-0.5 md:col-span-2">
      <Skeleton className="h-4 w-16 rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex flex-col gap-0.5 md:col-span-3">
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex flex-col gap-0.5 md:col-span-2">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex flex-col gap-0.5 md:col-span-5">
      <Skeleton className="h-4 w-12 rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  </div>
);

export default BalanceInfoSkeleton;
