"use client";

import { PrinterIcon } from "@heroicons/react/24/outline";

const PrintButton = () => {
  const handlePrint = () => window.print();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
      onClick={handlePrint}
    >
      <PrinterIcon className="h-4 w-4" />
      طباعة
    </button>
  );
};

export default PrintButton;
