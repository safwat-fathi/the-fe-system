"use client";

interface VoucherNavigationProps {
  currentRecord: number;
  totalRecords: number;
  onNavigate: (direction: "first" | "prev" | "next" | "last") => void;
}

export default function VoucherNavigation({
  currentRecord,
  totalRecords,
  onNavigate,
}: VoucherNavigationProps) {
  return (
    <div className="flex items-center gap-1 mr-2">
      <button
        className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
        onClick={() => onNavigate("first")}
      >
        <i className="bi bi-chevron-double-right text-sm" />
      </button>
      <button
        className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
        onClick={() => onNavigate("prev")}
      >
        <i className="bi bi-chevron-right text-sm" />
      </button>
      <span className="text-sm text-slate-600 px-3 font-medium">
        {currentRecord} من {totalRecords}
      </span>
      <button
        className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
        onClick={() => onNavigate("next")}
      >
        <i className="bi bi-chevron-left text-sm" />
      </button>
      <button
        className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
        onClick={() => onNavigate("last")}
      >
        <i className="bi bi-chevron-double-left text-sm" />
      </button>
    </div>
  );
}
