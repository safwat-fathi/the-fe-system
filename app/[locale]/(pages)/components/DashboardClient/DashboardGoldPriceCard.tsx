"use client";

import { StatCard } from "@/components/Card";
import { RiyalIcon } from "@/components/RiyalIcon";

type DashboardGoldPriceCardProps = {
  title: string;
  goldPrice: number | null;
  placeholder: string;
};

const DashboardGoldPriceCard = ({
  title,
  goldPrice,
  placeholder,
}: DashboardGoldPriceCardProps) => (
  <StatCard
    icon="💰"
    title={title}
    value={
      goldPrice != null ? (
        <>
          {goldPrice}
          <RiyalIcon className="inline-block ms-1 align-middle" size="0.95em" />
        </>
      ) : (
        placeholder
      )
    }
  />
);

export default DashboardGoldPriceCard;
