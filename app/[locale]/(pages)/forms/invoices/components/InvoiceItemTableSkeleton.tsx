const rowPlaceholders = Array.from({ length: 4 }, (_, idx) => idx);

const InvoiceItemTableSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[960px] p-4 space-y-4">
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
          {rowPlaceholders.map((row) => (
            <div key={row} className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-50 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemTableSkeleton;
