"use client";

import React from "react";

import Skeleton from "@/components/Skeleton";

const SharedTableSkeleton = () => {
  return (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="w-full">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 mb-4 pb-2 border-b">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded-md" />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((col) => (
              <Skeleton key={col} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedTableSkeleton;
