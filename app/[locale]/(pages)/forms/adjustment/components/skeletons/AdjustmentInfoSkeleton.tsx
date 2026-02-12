const AdjustmentInfoSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 animate-pulse">
      <div className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
          {/* Ref No */}
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <div className="h-3 w-16 bg-slate-200 rounded mb-0.5" />
            <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
          </div>

          {/* Date Time */}
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <div className="h-3 w-20 bg-slate-200 rounded mb-0.5" />
            <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <div className="h-3 w-16 bg-slate-200 rounded mb-0.5" />
            <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <div className="h-3 w-20 bg-slate-200 rounded mb-0.5" />
            <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
          </div>

          {/* Cost Center */}
          <div className="flex flex-col gap-0.5 md:col-span-1">
            <div className="h-3 w-24 bg-slate-200 rounded mb-0.5" />
            <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-1.5 mt-1.5">
          <div className="h-3 w-12 bg-slate-200 rounded mb-0.5" />
          <div className="w-full h-8 bg-slate-100 rounded border border-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default AdjustmentInfoSkeleton;
