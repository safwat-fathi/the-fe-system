"use client";

import { StatCard } from "@/components/Card";
import { RiyalIcon } from "@/components/RiyalIcon";
import { GoldOunceIcon } from "@/components/GoldOunceIcon";

type DashboardOunceCardsProps = {
  ounceUSD: number | null;
  ounceSAR: number | null;
  goldPrice: number | null;
  changeOunceUSD: number | null;
  changeOunceSAR: number | null;
  changePercent: number | null;
  titleUSD: string;
  titleSAR: string;
  titleGoldPerGram: string;
  placeholder: string;
};

const ChangeIndicator = ({
  change,
  changePercent,
  isPositive,
  symbol,
}: {
  change: number;
  changePercent: number;
  isPositive: boolean;
  symbol: string;
}) => {
  const sign = change >= 0 ? "+" : "";
  const pctSign = changePercent >= 0 ? "+" : "";
  const cls = isPositive ? "text-emerald-600" : "text-red-600";
  const Arrow = isPositive ? "▲" : "▼";

  return (
    <span className={`block text-sm font-medium mt-1 ${cls}`}>
      <span className="inline-block ms-1 align-middle" aria-hidden>
        {Arrow}
      </span>
      {sign}
      {change.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      {symbol} ({pctSign}
      {changePercent.toFixed(2)}%)
    </span>
  );
};

const DashboardOunceCards = ({
  ounceUSD,
  ounceSAR,
  goldPrice,
  changeOunceUSD,
  changeOunceSAR,
  changePercent,
  titleUSD,
  titleSAR,
  titleGoldPerGram,
  placeholder,
}: DashboardOunceCardsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <StatCard
      icon={<GoldOunceIcon size="1.75rem" className="text-amber-600" />}
      title={titleUSD}
      value={
        ounceUSD != null ? (
          <span className="inline-flex flex-col items-start">
            <span>
              {ounceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              <span className="text-lg font-bold">$</span>
            </span>
            {changeOunceUSD != null && changePercent != null && (
              <ChangeIndicator
                change={changeOunceUSD}
                changePercent={changePercent}
                isPositive={changeOunceUSD >= 0}
                symbol="$"
              />
            )}
          </span>
        ) : (
          placeholder
        )
      }
    />
    <StatCard
      icon={<GoldOunceIcon size="1.75rem" className="text-amber-600" />}
      title={titleSAR}
      value={
        ounceSAR != null ? (
          <span className="inline-flex flex-col items-start">
            <span>
              {ounceSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <RiyalIcon className="inline-block ms-1 align-middle" size="0.95em" />
            </span>
            {changeOunceSAR != null && changePercent != null && (
              <ChangeIndicator
                change={changeOunceSAR}
                changePercent={changePercent}
                isPositive={changeOunceSAR >= 0}
                symbol="ر.س"
              />
            )}
          </span>
        ) : (
          placeholder
        )
      }
    />
    <StatCard
      icon="💰"
      title={titleGoldPerGram}
      value={
        goldPrice != null ? (
          <>
            {goldPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <RiyalIcon className="inline-block ms-1 align-middle" size="0.95em" />
          </>
        ) : (
          placeholder
        )
      }
    />
  </div>
);

export default DashboardOunceCards;
