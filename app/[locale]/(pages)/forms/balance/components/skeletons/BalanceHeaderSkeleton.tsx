import Skeleton from "@/components/Skeleton";

const BalanceHeaderSkeleton = () => (
  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
    <div className="flex items-center gap-1.5 flex-wrap">
      <Skeleton className="h-6 w-48 rounded-md" />
      <div className="h-6 w-px bg-slate-300" />
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-24 rounded-md" />
    </div>
  </div>
);

export default BalanceHeaderSkeleton;
