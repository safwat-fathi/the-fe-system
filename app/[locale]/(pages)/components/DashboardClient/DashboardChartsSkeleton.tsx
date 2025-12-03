"use client";

const DashboardChartsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {["gold", "sales"].map((section) => (
        <div
          key={section}
          className="card p-6 space-y-4 animate-pulse flex flex-col"
        >
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {section === "gold" ? (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="h-10 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
              <div className="h-10 w-32 bg-gray-100 rounded" />
            </div>
          ) : null}
          <div className="flex-1 min-h-[16rem] bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
};

export default DashboardChartsSkeleton;
