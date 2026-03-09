"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@heroui/react";
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
  /** عند true يطبّق تمييزاً بصرياً أقوى (نظام الحسابات / نظام الذهب) */
  isSystemSection?: boolean;
  /** أيقونة اختيارية تظهر بجانب عنوان القسم (مثلاً للأنظمة) */
  icon?: ReactNode;
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
  isSystemSection = false,
  icon,
  animationVariants,
  transition,
  showToggleIcon = true,
  hideLabel = false,
}: SidebarSectionProps) => (
  <div className={clsx("mt-4", className)}>
    {hideLabel ? (
      <Tooltip content={label} placement="left">
        <div
          className={clsx(
            "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
            isSystemSection
              ? "bg-amber-950/30 text-amber-100 shadow-sm hover:bg-amber-900/35 hover:text-amber-50"
              : "text-slate-200 hover:bg-white/5 hover:text-white",
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
          {icon && (
            <div
              className={clsx(
                "flex shrink-0 items-center justify-center",
                isSystemSection ? "text-amber-400" : "text-slate-400",
              )}
            >
              {icon}
            </div>
          )}
          <span className={clsx("min-w-0 flex-1", hideLabel && "sr-only")}>
            {label}
          </span>
          {showToggleIcon && (
            <div className={clsx("shrink-0", isSystemSection ? "text-amber-400/90" : "text-slate-400")}>
              {isOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </Tooltip>
    ) : (
      <div
        className={clsx(
          "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
          isSystemSection
            ? "bg-amber-950/30 text-amber-100 shadow-sm hover:bg-amber-900/35 hover:text-amber-50"
            : "text-slate-200 hover:bg-white/5 hover:text-white",
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
        {icon && (
          <div
            className={clsx(
              "flex shrink-0 items-center justify-center",
              isSystemSection ? "text-amber-400" : "text-slate-400",
            )}
          >
            {icon}
          </div>
        )}
        <span
          className={clsx(
            "min-w-0 flex-1",
            hideLabel && !icon && "hidden",
            hideLabel && icon && "sr-only",
          )}
        >
          {label}
        </span>
        {showToggleIcon && (
          <div className={clsx("shrink-0", isSystemSection ? "text-amber-400/90" : "text-slate-400")}>
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    )}

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
