"use client";

import Link from "next/link";
import CountUp from "react-countup";


export default function StatCard({ title, icon, value, href }: {
  title: string;
  icon?: React.ReactNode;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-sm text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
// "use client";
// import { Card, CardHeader, CardBody } from "@heroui/react";

// export default function StatCard({
//   title,
//   value,
// }: {
//   title: string;
//   value: React.ReactNode;
// }) {
//   return (
//     <Card className="flex-1">
//       <CardHeader className="text-sm text-gray-500">{title}</CardHeader>
//       <CardBody>
//         <p className="text-2xl font-bold">{value}</p>
//       </CardBody>
//     </Card>
//   );
// }
