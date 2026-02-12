const AdjustmentTableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 p-0.5 animate-pulse">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-0.5">
        <div className="h-6 w-16 bg-slate-200 rounded" />
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
      </div>

      <div className="overflow-x-auto mb-0.5 max-w-full">
        <div className="max-h-[500px] overflow-y-auto">
          <div className="min-w-[1350px]">
            {/* Table Header */}
            <div className="h-8 bg-gray-100 w-full mb-1" />

            {/* Table Rows */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-1 mb-1">
                {[...Array(12)].map((_, j) => (
                  <div
                    key={j}
                    className="h-8 bg-slate-50 flex-1 rounded border border-slate-100"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentTableSkeleton;
