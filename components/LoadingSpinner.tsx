"use client";

import { Spinner, Skeleton } from "@heroui/react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-4 ${className || ""}`}>
      <Spinner 
        size={size}
        color="primary"
        label={label}
        classNames={{
          circle1: "border-b-blue-600",
          circle2: "border-b-blue-600/50",
          label: "text-primary font-medium mt-2"
        }}
      />
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  message?: string;
}

export function PageLoading({ title = "جاري التحميل", message = "يرجى الانتظار بينما نجهز المحتوى لك" }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Spinner 
              size="lg"
              color="primary"
              classNames={{
                circle1: "border-b-blue-600",
                circle2: "border-b-blue-600/50",
              }}
            />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {title}
              </h2>
              <p className="mt-2 text-gray-600">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-1/3 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3 rounded-lg" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return <PageLoading />;
}