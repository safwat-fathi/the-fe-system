"use client";

import { Skeleton } from "@heroui/react";

export default function BasicDataLoading() {
  return (
    <div className="responsive-container font-cairo">
      <Skeleton className="rounded-lg mb-6">
        <div className="h-8 w-48 bg-gray-200" />
      </Skeleton>

      <div className="space-y-4">
        <Skeleton className="rounded-lg">
          <div className="h-12 w-full bg-gray-200" />
        </Skeleton>
        
        <Skeleton className="rounded-lg">
          <div className="h-96 w-full bg-gray-200" />
        </Skeleton>
      </div>
    </div>
  );
}

