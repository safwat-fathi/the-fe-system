"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

interface TokenDisplayProps {
  accessToken?: string;
  refreshToken?: string;
}

const TokenDisplay = ({ accessToken, refreshToken }: TokenDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="font-bold text-lg">Access Token</CardHeader>
        <CardBody>
          <div className="bg-gray-100 p-3 rounded-lg break-all text-sm font-mono">
            {accessToken || "غير متوفر"}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-bold text-lg">Refresh Token</CardHeader>
        <CardBody>
          <div className="bg-gray-100 p-3 rounded-lg break-all text-sm font-mono">
            {refreshToken || "غير متوفر"}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TokenDisplay;
