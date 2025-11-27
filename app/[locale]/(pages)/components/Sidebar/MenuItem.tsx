"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import IconRenderer from "@/components/IconRenderer";
import { MenuObject } from "@/types/models/menu";

interface MenuItemProps {
  item: MenuObject;
  isOpen: boolean;
  pathname: string;
}

const animationVariants = {
  hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
  visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
};

const transition = { duration: 0.3, ease: "easeInOut", delay: 0.05 };

export default function MenuItem({ item, isOpen, pathname }: MenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.path;
  const isSection = item.type === "section";

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Leaf node (screen) - render as link
  if (!hasChildren && item.path) {
    return (
      <Link
        className={clsx(
          "flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group",
          {
            "bg-blue-600/20 text-blue-300": isActive,
            "hover:bg-gray-700/50 text-gray-300 hover:text-white": !isActive,
          },
        )}
        href={item.path}
        prefetch={true}
        style={{
          paddingLeft: isOpen ? "2.5rem" : "0.75rem",
        }}
      >
        <div className="text-sm">
          <IconRenderer className="h-5 w-5" iconName={item.icon} />
        </div>
        {isOpen && (
          <span className="text-sm whitespace-nowrap">{item.name}</span>
        )}
      </Link>
    );
  }

  // Non-leaf node (module/section) - render as collapsible
  return (
    <div>
      {/* Header */}
      <div
        className={clsx(
          "px-3 py-2 cursor-pointer flex justify-between items-center transition-colors",
          {
            "text-sm font-semibold text-gray-300 hover:text-white":
              item.type === "module",
            "text-xs text-gray-400 hover:text-gray-200": isSection,
          },
        )}
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <IconRenderer className="h-5 w-5" iconName={item.icon} />
          </div>
          {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
        </div>
        {isOpen && hasChildren && (
          <div className="text-gray-500">
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              animate="visible"
              className="flex flex-col overflow-hidden"
              exit="hidden"
              initial="hidden"
              transition={transition}
              variants={animationVariants}
            >
              {item.children?.map((child) => (
                <MenuItem
                  key={child.id}
                  isOpen={isOpen}
                  item={child}
                  pathname={pathname}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
