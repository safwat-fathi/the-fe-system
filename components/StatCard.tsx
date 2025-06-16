"use client";
import { Card, CardHeader, CardBody } from "@heroui/react";

export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="flex-1">
      <CardHeader className="text-sm text-gray-500">{title}</CardHeader>
      <CardBody>
        <p className="text-2xl font-bold">{value}</p>
      </CardBody>
    </Card>
  );
}
