"use client";

import React from "react";

import Skeleton from "@/components/Skeleton";

const PaymentTotalsSkeleton = () => {
  return (
    <div className="flex flex-col items-end gap-2 p-4 mt-4 border-t border-gray-100">
      <div className="flex justify-between w-full md:w-1/3 gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex justify-between w-full md:w-1/3 gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex justify-between w-full md:w-1/3 gap-4">
        <Skeleton className="h-6 w-24 font-bold" />
        <Skeleton className="h-6 w-32 font-bold" />
      </div>
    </div>
  );
};

export default PaymentTotalsSkeleton;
