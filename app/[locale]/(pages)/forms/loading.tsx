"use client";

import { Skeleton } from "@heroui/react";

export default function FormsLoading() {
  return (
    <div className="font-cairo space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-lg" />
      </div>

      {/* Form skeleton */}
      <div className="card p-6 space-y-6">
        {/* Form header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Skeleton className="h-6 w-1/6 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>

        {/* Form fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="h-4 w-1/3 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <Skeleton className="h-6 w-1/6 rounded-lg" />
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 justify-end">
          <Skeleton className="h-12 w-24 rounded-lg" />
          <Skeleton className="h-12 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
