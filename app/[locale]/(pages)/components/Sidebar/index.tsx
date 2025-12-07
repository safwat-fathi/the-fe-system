"use client";

import type { SidebarLinkConfig } from "./sidebarTypes";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState, useCallback } from "react";

import SidebarHeader from "./SidebarHeader";
import SidebarLinkList from "./SidebarLinkList";
import SidebarSection from "./SidebarSection";
import {
  accountingBasicLinks,
  accountingFormLinks,
  goldBasicLinks,
  goldFormLinks,
  mainLinks,
  ReportsIcon,
  settingsLinks,
} from "./sidebarConfig";
import { createIsLinkActive, type TranslateLinkLabel } from "./sidebarUtils";
import {
  SIDEBAR_OBJECT_IDS,
  type SidebarPermissionKey,
} from "./sidebarPermissions";

interface SidebarProps {
  isAdmin?: boolean;
  allowedObjectIds?: number[];
}

const Sidebar = ({
  isAdmin = false,
  allowedObjectIds = [],
}: SidebarProps): JSX.Element => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // نظام الحسابات
  const [showAccountingSystem, setShowAccountingSystem] = useState(true);
  const [showAccountingBasic, setShowAccountingBasic] = useState(true);
  const [showAccountingForms, setShowAccountingForms] = useState(true);

  // نظام الذهب
  const [showGoldSystem, setShowGoldSystem] = useState(true);
  const [showGoldBasic, setShowGoldBasic] = useState(true);
  const [showGoldForms, setShowGoldForms] = useState(true);

  const [showSettingsLinks, setShowSettingsLinks] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tSidebar = useTranslations("sidebar");
  const tBreadcrumbs = useTranslations("navigation.breadcrumbs");

  const allowedIdsSet = useMemo(
    () => new Set(allowedObjectIds ?? []),
    [allowedObjectIds],
  );

  const canShowSection = useCallback(
    (key: SidebarPermissionKey) => {
      if (isAdmin) {
        return true;
      }

      const ids = SIDEBAR_OBJECT_IDS[key];

      if (!ids) {
        return true;
      }

      return ids.some((id) => allowedIdsSet.has(id));
    },
    [allowedIdsSet, isAdmin],
  );

  const translateLinkLabel: TranslateLinkLabel = (link: SidebarLinkConfig) => {
    if (link.translationSource === "home") {
      return tBreadcrumbs(link.translationKey);
    }

    if (link.translationSource === "segment") {
      return tBreadcrumbs(`segments.${link.translationKey}`);
    }

    return tSidebar(link.translationKey);
  };

  const isLinkActive = useMemo(
    () => createIsLinkActive(pathname, searchParams),
    [pathname, searchParams],
  );

  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.3, ease: "easeInOut", delay: 0.05 };

  const reportsIsActive = pathname.startsWith("/reports");

  const SectionToggleLabel = ({ label }: { label: string }) => (
    <span className={clsx({ block: isSidebarOpen, hidden: !isSidebarOpen })}>
      {label}
    </span>
  );

  return (
    <aside
      className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen ${
        isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
      } shadow-[4px_0_20px_rgba(0,0,0,0.4)] border-r border-amber-900/20`}
    >
      <SidebarHeader
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarLinkList
          indent="0"
          isLinkActive={isLinkActive}
          isSidebarOpen={isSidebarOpen}
          links={mainLinks}
          translateLinkLabel={translateLinkLabel}
        />

        {canShowSection("accountingSystem") && (
          <SidebarSection
            animationVariants={animationVariants}
            hideLabel={!isSidebarOpen}
            isOpen={showAccountingSystem}
            label={tSidebar("sections.accountingSystem")}
            onToggle={() => setShowAccountingSystem(!showAccountingSystem)}
            showToggleIcon={isSidebarOpen}
            transition={transition}
          >
            {canShowSection("accountingBasic") && (
              <SidebarSection
                animationVariants={animationVariants}
                className="mt-0"
                headerClassName="text-xs text-slate-400 font-normal"
                hideLabel={!isSidebarOpen}
                isOpen={showAccountingBasic}
                label={tSidebar("sections.accountingBasic")}
                onToggle={() => setShowAccountingBasic(!showAccountingBasic)}
                showToggleIcon={isSidebarOpen}
                transition={transition}
              >
                <SidebarLinkList
                  indent="2.5rem"
                  isLinkActive={isLinkActive}
                  isSidebarOpen={isSidebarOpen}
                  links={accountingBasicLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}

            {accountingFormLinks.length > 0 &&
              canShowSection("accountingForms") && (
                <SidebarSection
                  animationVariants={animationVariants}
                  className="mt-2"
                  headerClassName="text-xs text-slate-400 font-normal"
                  hideLabel={!isSidebarOpen}
                  isOpen={showAccountingForms}
                  label={tSidebar("sections.accountingForms")}
                  onToggle={() => setShowAccountingForms(!showAccountingForms)}
                  showToggleIcon={isSidebarOpen}
                  transition={transition}
                >
                  <SidebarLinkList
                    indent="2.5rem"
                    isLinkActive={isLinkActive}
                    isSidebarOpen={isSidebarOpen}
                    links={accountingFormLinks}
                    translateLinkLabel={translateLinkLabel}
                  />
                </SidebarSection>
              )}
          </SidebarSection>
        )}

        {canShowSection("reports") && (
          <div className="mt-4">
            <Link
              className={clsx(
                "flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group backdrop-blur-sm",
                {
                  "bg-gradient-to-r from-amber-600/80 to-amber-700/80 shadow-lg shadow-amber-900/30":
                    reportsIsActive,
                  "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40":
                    !reportsIsActive,
                },
              )}
              href="/reports"
            >
              <div
                className={clsx("text-lg transition-all", {
                  "text-white drop-shadow-lg": reportsIsActive,
                  "text-slate-300 group-hover:text-white": !reportsIsActive,
                })}
              >
                <ReportsIcon className="h-5 w-5" />
              </div>
              <SectionToggleLabel label={tSidebar("sections.reports")} />
            </Link>
          </div>
        )}

        {canShowSection("goldSystem") && (
          <SidebarSection
            animationVariants={animationVariants}
            hideLabel={!isSidebarOpen}
            isOpen={showGoldSystem}
            label={tSidebar("sections.goldSystem")}
            onToggle={() => setShowGoldSystem(!showGoldSystem)}
            showToggleIcon={isSidebarOpen}
            transition={transition}
          >
            {canShowSection("goldBasic") && (
              <SidebarSection
                animationVariants={animationVariants}
                className="mt-0"
                headerClassName="text-xs text-slate-400 font-normal"
                hideLabel={!isSidebarOpen}
                isOpen={showGoldBasic}
                label={tSidebar("sections.goldBasic")}
                onToggle={() => setShowGoldBasic(!showGoldBasic)}
                showToggleIcon={isSidebarOpen}
                transition={transition}
              >
                <SidebarLinkList
                  indent="2.5rem"
                  isLinkActive={isLinkActive}
                  isSidebarOpen={isSidebarOpen}
                  links={goldBasicLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}

            {canShowSection("goldForms") && (
              <SidebarSection
                animationVariants={animationVariants}
                className="mt-2"
                headerClassName="text-xs text-slate-400 font-normal"
                hideLabel={!isSidebarOpen}
                isOpen={showGoldForms}
                label={tSidebar("sections.goldForms")}
                onToggle={() => setShowGoldForms(!showGoldForms)}
                showToggleIcon={isSidebarOpen}
                transition={transition}
              >
                <SidebarLinkList
                  indent="2.5rem"
                  isLinkActive={isLinkActive}
                  isSidebarOpen={isSidebarOpen}
                  links={goldFormLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}
          </SidebarSection>
        )}

        <SidebarSection
          animationVariants={animationVariants}
          hideLabel={!isSidebarOpen}
          isOpen={showSettingsLinks}
          label={tSidebar("sections.settings")}
          onToggle={() => setShowSettingsLinks(!showSettingsLinks)}
          showToggleIcon={isSidebarOpen}
          transition={transition}
        >
          <SidebarLinkList
            indent="2.5rem"
            isLinkActive={isLinkActive}
            isSidebarOpen={isSidebarOpen}
            links={settingsLinks}
            translateLinkLabel={translateLinkLabel}
          />
        </SidebarSection>
      </nav>
    </aside>
  );
};

export default Sidebar;
