"use client";

const GoldTableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 animate-pulse">
      <div className="p-1 border-b border-slate-200 bg-slate-50">
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="p-2">
        <div className="flex justify-between mb-2">
          <div className="h-6 w-24 bg-slate-200 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                {[...Array(8)].map((_, i) => (
                  <th key={i} className="p-2 border">
                    <div className="h-4 w-16 bg-slate-200 rounded mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {[...Array(8)].map((_, colIndex) => (
                    <td key={colIndex} className="p-2 border">
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

export default GoldTableSkeleton;
