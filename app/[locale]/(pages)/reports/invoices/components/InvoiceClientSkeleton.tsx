const rows = Array.from({ length: 6 }, (_, idx) => idx);

const InvoiceClientSkeleton = () => {
  return (
    <div
      className="space-y-4 animate-pulse"
      data-testid="invoice-client-skeleton"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-12 bg-gray-100 rounded" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="h-12 border-b border-gray-200" />
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div key={row} className="grid grid-cols-4 gap-4 p-4">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceClientSkeleton;
