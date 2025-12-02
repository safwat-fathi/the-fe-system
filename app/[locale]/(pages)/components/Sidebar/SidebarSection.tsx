"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

type SidebarSectionProps = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  animationVariants: {
    hidden: { clipPath: string; opacity: number };
    visible: { clipPath: string; opacity: number };
  };
  transition: { duration: number; ease: string; delay: number };
  showToggleIcon?: boolean;
  hideLabel?: boolean;
};

const SidebarSection = ({
  label,
  isOpen,
  onToggle,
  children,
  className,
  headerClassName,
  animationVariants,
  transition,
  showToggleIcon = true,
  hideLabel = false,
}: SidebarSectionProps) => (
  <div className={clsx("mt-4", className)}>
    <div
      className={clsx(
        "px-3 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer flex justify-between items-center hover:text-white hover:bg-white/5 rounded-lg transition-all",
        headerClassName,
      )}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <span className={hideLabel ? "hidden" : undefined}>{label}</span>
      {showToggleIcon && (
        <div className="text-slate-400">
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </div>
      )}
    </div>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          animate="visible"
          className="flex flex-col overflow-hidden mt-2"
          exit="hidden"
          initial="hidden"
          transition={transition}
          variants={animationVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default SidebarSection;
