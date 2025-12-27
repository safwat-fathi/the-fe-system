"use client";

import { Skeleton } from "@heroui/react";

export default function ItemsFallback() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
        {/* Table Header Skeleton */}
        <div className="h-10 border-b border-gray-100 flex items-center px-4 bg-gray-50/50">
          <Skeleton className="w-1/6 h-4 rounded-lg mr-4" />
          <Skeleton className="w-1/6 h-4 rounded-lg mr-4" />
          <Skeleton className="w-1/6 h-4 rounded-lg mr-4" />
          <Skeleton className="w-1/6 h-4 rounded-lg mr-4" />
          <Skeleton className="w-1/6 h-4 rounded-lg" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="w-1/6 h-3 rounded-lg mr-4" />
              <Skeleton className="w-1/4 h-3 rounded-lg mr-4" />
              <Skeleton className="w-1/6 h-3 rounded-lg mr-4" />
              <Skeleton className="w-1/6 h-3 rounded-lg mr-4" />
              <Skeleton className="w-1/12 h-3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex-shrink-0 flex justify-center py-1 mt-2">
        <Skeleton className="w-48 h-8 rounded-medium" />
      </div>
    </div>
  );
}
