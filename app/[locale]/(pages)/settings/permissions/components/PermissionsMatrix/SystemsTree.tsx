"use client";

import { Accordion, AccordionItem } from "@heroui/react";

import { SYSTEM_MAP } from "../../utils/system-map";

import SystemSection from "./SystemSection";

export default function SystemsTree() {
  return (
    <div className="space-y-4">
      <Accordion
        defaultExpandedKeys={["accounting", "gold", "settings"]}
        selectionMode="multiple"
        variant="bordered"
      >
        {SYSTEM_MAP.systems.map((system) => (
          <AccordionItem
            key={system.id}
            aria-label={system.name}
            title={
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    system.color === "blue"
                      ? "bg-blue-500"
                      : system.color === "amber"
                        ? "bg-amber-500"
                        : "bg-slate-500"
                  }`}
                />
                <span className="font-semibold text-lg">{system.name}</span>
                <span className="text-sm text-gray-500">
                  ({system.sections.length} أقسام)
                </span>
              </div>
            }
          >
            <SystemSection system={system} />
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
