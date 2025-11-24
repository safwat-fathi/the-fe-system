"use client";

import { Accordion, AccordionItem } from "@heroui/react";

import { System } from "../../types/systems";

import PermissionToggle from "./PermissionToggle";

interface SystemSectionProps {
  system: System;
}

export default function SystemSection({ system }: SystemSectionProps) {
  return (
    <div className="space-y-2">
      <Accordion selectionMode="multiple" variant="light">
        {system.sections.map((section) => (
          <AccordionItem
            key={section.id}
            aria-label={section.name}
            title={
              <div className="flex items-center gap-2">
                <span className="font-medium">{section.name}</span>
                <span className="text-xs text-gray-500">
                  ({section.screens.length} شاشات)
                </span>
              </div>
            }
          >
            <div className="space-y-3 p-4">
              {section.screens.map((screen) => (
                <div
                  key={screen.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {screen.name}
                      </h4>
                      {screen.path && (
                        <p className="text-xs text-gray-500 mt-1">
                          {screen.path}
                        </p>
                      )}
                    </div>
                  </div>
                  <PermissionToggle screen={screen} />
                </div>
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
