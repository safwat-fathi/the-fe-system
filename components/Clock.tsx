"use client";

import { useEffect, useState, memo } from "react";
import { ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";

const formatTime = (date: Date | null) => {
  if (!date) return "--:--:--";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

const formatDate = (date: Date | null) => {
  if (!date) return "--/--/----";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

function Clock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="h-4 w-4 text-slate-400" />
        <span className="font-medium">{formatDate(currentTime)}</span>
      </div>
      <span className="text-slate-300">|</span>
      <div className="flex items-center gap-1.5">
        <ClockIcon className="h-4 w-4 text-slate-400" />
        <span className="font-mono font-semibold text-slate-700">
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  );
}

export default memo(Clock);
