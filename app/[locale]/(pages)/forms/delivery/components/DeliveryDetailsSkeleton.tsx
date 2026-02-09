"use client";

const DeliveryDetailsSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 p-2 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="space-y-1">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-full bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailsSkeleton;
