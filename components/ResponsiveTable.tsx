"use client";

import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
  scrollable?: boolean;
}

export default function ResponsiveTable({ 
  children, 
  className = "", 
  ariaLabel = "جدول متجاوب",
  compact = false,
  scrollable = true
}: ResponsiveTableProps) {
  return (
    <div className={`
      ${scrollable ? 'responsive-table' : ''}
      ${compact ? 'text-sm' : ''}
      ${className}
    `}>
      <div className="responsive-table-wrapper">
        <Table 
          aria-label={ariaLabel}
          className={compact ? 'text-xs sm:text-sm' : ''}
        >
          {children}
        </Table>
      </div>
    </div>
  );
}

// Export table components for convenience
export { TableHeader, TableColumn, TableBody, TableRow, TableCell };
