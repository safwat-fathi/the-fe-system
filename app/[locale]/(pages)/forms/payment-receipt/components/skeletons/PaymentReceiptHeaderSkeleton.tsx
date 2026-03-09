"use client";

import React from "react";

import Skeleton from "@/components/Skeleton";

const PaymentReceiptHeaderSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 border-b border-gray-100">
      <div className="flex flex-col gap-2 w-full md:w-1/2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
      <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
};

export default PaymentReceiptHeaderSkeleton;
