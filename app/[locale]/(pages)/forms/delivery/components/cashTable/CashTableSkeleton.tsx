"use client";

import { CASH_TABLE_COLUMNS } from "../../constants";

const CashTableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 animate-pulse">
      <div className="p-1 border-b border-slate-200 bg-slate-50">
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="p-0.5">
        <div className="flex justify-between mb-0.5">
          <div className="h-6 w-24 bg-slate-200 rounded" />
        </div>
        <div className="overflow-x-auto mb-0.5 max-w-full">
          <table className="w-full border text-xs text-center">
            <thead className="bg-gray-100">
              <tr>
                {CASH_TABLE_COLUMNS.map((column) => (
                  <th key={column.key} className={`p-1 border ${column.width}`}>
                    <div className="h-4 w-full bg-slate-200 rounded mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {CASH_TABLE_COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className={`p-1 border ${column.width}`}
                    >
                      <div className="h-6 w-full bg-slate-200 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashTableSkeleton;
