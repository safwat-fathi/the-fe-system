"use client";

import React from "react";

import Skeleton from "@/components/Skeleton";

const CashReceiptInfoSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    </div>
  );
};

export default CashReceiptInfoSkeleton;
