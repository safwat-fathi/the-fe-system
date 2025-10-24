"use client";

import Link from "next/link";
import CountUp from "react-countup";

export default function StatCard({
  title,
  icon,
  value,
  href,
}: {
  title: string;
  icon?: React.ReactNode;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="card card-hover p-6 flex items-center gap-4 group">
      <div className="text-2xl text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-xl font-bold text-gray-800 truncate">
          {typeof value === "number" ? (
            <CountUp duration={1.5} end={value} separator="," />
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link className="block no-underline" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}
