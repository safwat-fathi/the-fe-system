const AdjustmentTotalsSkeleton = () => {
  return (
    <div className="mt-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  );
};

export default AdjustmentTotalsSkeleton;
