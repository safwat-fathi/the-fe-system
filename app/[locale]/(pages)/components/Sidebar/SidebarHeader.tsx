"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

type SidebarHeaderProps = {
  isSidebarOpen: boolean;
  onToggle: () => void;
};

const SidebarHeader = ({ isSidebarOpen, onToggle }: SidebarHeaderProps) => (
  <div className="relative border-b border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-transparent to-transparent rounded-b-xl">
    <div
      className={`flex items-center h-16 mb-3 ${isSidebarOpen ? "justify-between" : "justify-center"}`}
    >
      {isSidebarOpen && (
        <div className="flex items-center relative">
          <h2 className="text-4xl font-black whitespace-nowrap relative">
            <span
              className="relative inline-block gradient-text-animated"
              style={{
                filter:
                  "drop-shadow(0 0 8px rgba(217, 119, 6, 0.6)) drop-shadow(0 0 15px rgba(180, 83, 9, 0.4))",
              }}
            >
              نفيس
            </span>
          </h2>
        </div>
      )}
      <Button
        className={`text-white hover:bg-white/10 rounded-lg transition-all duration-200 ${!isSidebarOpen ? "min-w-0 flex items-center justify-center" : ""}`}
        size="sm"
        style={
          !isSidebarOpen
            ? {
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : undefined
        }
        variant="light"
        onPress={onToggle}
      >
        <Bars3Icon className="h-5 w-5" />
      </Button>
    </div>
  </div>
);

export default SidebarHeader;
