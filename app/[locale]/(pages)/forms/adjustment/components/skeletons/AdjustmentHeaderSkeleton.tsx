export default function AdjustmentHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200 flex items-center justify-between gap-1.5 flex-wrap animate-pulse">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Title Skeleton */}
        <div className="h-7 w-48 bg-slate-200 rounded-md" />

        <div className="h-6 w-px bg-slate-300" />

        {/* Buttons Skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-7 w-20 bg-slate-200 rounded-md" />
        ))}

        {/* Navigation Arrows Skeleton */}
        <div className="flex gap-1">
          <div className="h-7 w-8 bg-slate-200 rounded-md" />
          <div className="h-7 w-8 bg-slate-200 rounded-md" />
          <div className="h-7 w-8 bg-slate-200 rounded-md" />
          <div className="h-7 w-8 bg-slate-200 rounded-md" />
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-32 h-7 bg-slate-200 rounded-md" />
          <div className="h-7 w-8 bg-slate-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}
