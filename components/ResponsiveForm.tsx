"use client";

import React from "react";

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3;
  gap?: "sm" | "md" | "lg";
  onSubmit?: (e: React.FormEvent) => void;
}

export default function ResponsiveForm({
  children,
  className = "",
  cols = 3,
  gap = "md",
  onSubmit,
}: ResponsiveFormProps) {
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  const gapClasses = {
    sm: "gap-2 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
  };

  return (
    <form
      className={`
        responsive-form
        grid
        ${colsClasses[cols]}
        ${gapClasses[gap]}
        ${className}
      `}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

// Helper component for full-width form fields
export function FormFieldFull({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3">{children}</div>
  );
}

// Helper component for half-width form fields
export function FormFieldHalf({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 sm:col-span-1">{children}</div>;
}
