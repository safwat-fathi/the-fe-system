"use client";

import { Skeleton } from "@heroui/react";

export default function DashboardLoading() {
  return (
    <div className="font-cairo space-y-8 p-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3 rounded-lg" />
        <Skeleton className="h-6 w-1/4 rounded-lg" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Gold Price Card skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>

      {/* Action Buttons skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
    </div>
  );
}