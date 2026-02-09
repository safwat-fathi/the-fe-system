"use client";

const DeliveryHeaderSkeleton = () => {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200 animate-pulse">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-5 w-32 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-32 bg-slate-200 rounded" />
          <div className="h-7 w-8 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-20 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default DeliveryHeaderSkeleton;
