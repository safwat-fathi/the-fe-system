"use client";

const DeliveryTotalsSkeleton = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200 mt-1.5 flex flex-wrap items-center justify-between gap-3 animate-pulse">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
};

export default DeliveryTotalsSkeleton;
