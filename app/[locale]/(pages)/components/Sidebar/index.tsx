"use client";

import type { SidebarLinkConfig } from "./sidebarTypes";
import type { MenuObject } from "@/types/models/menu";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
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

import { usePermissionStore } from "@/stores/permissionStore";
import { type AppAbilities } from "@/lib/casl/ability";

// All actions we recognise — used to ask "can the user do ANYTHING on this subject?"
const APP_ACTIONS: AppAbilities[0][] = [
  "view",
  "read",
  "create",
  "update",
  "delete",
  "export",
  "print",
  "manage",
];

type MenuPathMaps = {
  withQuery: Map<string, MenuObject>;
  withoutQuery: Map<string, MenuObject>;
};

const normalizePath = (
  input: string,
  locale: string,
  options?: { keepQuery?: boolean },
): string => {
  const { keepQuery = false } = options ?? {};

  if (!input) {
    return "/";
  }

  const trimmed = input.trim();
  const queryIndex = trimmed.indexOf("?");
  const hasQuery = queryIndex >= 0;
  const pathPart = hasQuery ? trimmed.slice(0, queryIndex) : trimmed;
  const queryPart = hasQuery ? trimmed.slice(queryIndex + 1) : "";

  let normalized = pathPart;

  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized.length === 0) {
    normalized = "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  const localePrefix = locale ? `/${locale}` : "";

  if (
    localePrefix &&
    (normalized === localePrefix || normalized.startsWith(`${localePrefix}/`))
  ) {
    const withoutLocale = normalized.slice(localePrefix.length) || "/";

    normalized = withoutLocale.startsWith("/")
      ? withoutLocale
      : `/${withoutLocale}`;
  }

  if (keepQuery && queryPart) {
    return `${normalized}?${queryPart}`;
  }

  return normalized;
};

const buildMenuPathMaps = (objects: MenuObject[], locale: string): MenuPathMaps => {
  const withQuery = new Map<string, MenuObject>();
  const withoutQuery = new Map<string, MenuObject>();

  objects.forEach((obj) => {
    if (!obj.path) {
      return;
    }

    const normalizedWithQuery = normalizePath(obj.path, locale, {
      keepQuery: true,
    });
    const normalizedWithoutQuery = normalizePath(obj.path, locale);

    if (!withQuery.has(normalizedWithQuery)) {
      withQuery.set(normalizedWithQuery, obj);
    }

    if (!withoutQuery.has(normalizedWithoutQuery)) {
      withoutQuery.set(normalizedWithoutQuery, obj);
    }
  });

  return { withQuery, withoutQuery };
};

interface SidebarProps {
  isAdmin?: boolean;
  allowedObjectIds?: number[];
  menuObjects?: MenuObject[];
}

const Sidebar = ({
  isAdmin = false,
  allowedObjectIds = [],
  menuObjects = [],
}: SidebarProps): JSX.Element => {
  const ability = usePermissionStore((state) => state.ability);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const locale = useLocale();

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

  const { withQuery: menuPathsWithQuery, withoutQuery: menuPathsWithoutQuery } =
    useMemo(() => buildMenuPathMaps(menuObjects, locale), [locale, menuObjects]);

  const allowedIdsSet = useMemo(
    () => new Set(allowedObjectIds ?? []),
    [allowedObjectIds],
  );

  const findMenuObjectByHref = useCallback(
    (href: string) => {
      if (!href) {
        return null;
      }

      const normalizedWithQuery = normalizePath(href, locale, {
        keepQuery: true,
      });
      const matchWithQuery = menuPathsWithQuery.get(normalizedWithQuery);

      if (matchWithQuery) {
        return matchWithQuery;
      }

      const normalizedWithoutQuery = normalizePath(href, locale);

      return menuPathsWithoutQuery.get(normalizedWithoutQuery) ?? null;
    },
    [locale, menuPathsWithQuery, menuPathsWithoutQuery],
  );

  const getObjectIdsFromMenu = useCallback(
    (href: string) => {
      const menuObject = findMenuObjectByHref(href);

      return menuObject ? [menuObject.id] : undefined;
    },
    [findMenuObjectByHref],
  );

  const canShowLink = useCallback(
    (
      link: SidebarLinkConfig,
      fallbackObjectIds?: readonly number[],
    ): boolean => {
      if (isAdmin) {
        return true;
      }

      // --- CASL ability check (takes priority when caslSubject is declared) ---
      if (link.caslSubject) {
        // Show the link if the user has ANY permission on this subject
        return APP_ACTIONS.some((action) =>
          ability.can(action, link.caslSubject!),
        );
      }

      // --- Fallback: legacy object-ID check ---
      if (allowedIdsSet.size === 0) {
        return false;
      }

      let objectIds =
        link.requiredObjectIds && link.requiredObjectIds.length > 0
          ? link.requiredObjectIds
          : undefined;

      if (!objectIds || objectIds.length === 0) {
        objectIds = getObjectIdsFromMenu(link.href);
      }

      if ((!objectIds || objectIds.length === 0) && fallbackObjectIds) {
        objectIds = [...fallbackObjectIds];
      }

      if (!objectIds || objectIds.length === 0) {
        return false;
      }

      return objectIds.some((id) => allowedIdsSet.has(id));
    },
    [ability, allowedIdsSet, getObjectIdsFromMenu, isAdmin],
  );

  const filterLinks = useCallback(
    (
      links: SidebarLinkConfig[],
      fallbackObjectIds?: readonly number[],
    ): SidebarLinkConfig[] =>
      links.filter((link) => canShowLink(link, fallbackObjectIds)),
    [canShowLink],
  );

  const visibleMainLinks = useMemo(
    () => filterLinks(mainLinks),
    [filterLinks],
  );

  const visibleAccountingBasicLinks = useMemo(
    () =>
      filterLinks(accountingBasicLinks, SIDEBAR_OBJECT_IDS.accountingBasic),
    [filterLinks],
  );

  const visibleAccountingFormLinks = useMemo(
    () =>
      filterLinks(accountingFormLinks, SIDEBAR_OBJECT_IDS.accountingForms),
    [filterLinks],
  );

  const visibleGoldBasicLinks = useMemo(
    () => filterLinks(goldBasicLinks, SIDEBAR_OBJECT_IDS.goldBasic),
    [filterLinks],
  );

  const visibleGoldFormLinks = useMemo(
    () => filterLinks(goldFormLinks, SIDEBAR_OBJECT_IDS.goldForms),
    [filterLinks],
  );

  const visibleSettingsLinks = useMemo(
    () => filterLinks(settingsLinks, SIDEBAR_OBJECT_IDS.settings),
    [filterLinks],
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

      // If objectId check passes, show the section
      if (ids.some((id) => allowedIdsSet.has(id))) {
        return true;
      }

      // If the ability has been loaded with any rules, allow the section container
      // through — individual link filtering (visibleLinks.length > 0) acts as the
      // real gate, so an empty section will still collapse naturally.
      return ability.rules.length > 0;
    },
    [ability, allowedIdsSet, isAdmin],
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

  const showAccountingBasicSection =
    canShowSection("accountingBasic") && visibleAccountingBasicLinks.length > 0;

  const showAccountingFormsSection =
    canShowSection("accountingForms") && visibleAccountingFormLinks.length > 0;

  const showGoldBasicSection =
    canShowSection("goldBasic") && visibleGoldBasicLinks.length > 0;

  const showGoldFormsSection =
    canShowSection("goldForms") && visibleGoldFormLinks.length > 0;

  const showSettingsSection =
    canShowSection("settings") && visibleSettingsLinks.length > 0;

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
          links={visibleMainLinks}
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
            {showAccountingBasicSection && (
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
                  links={visibleAccountingBasicLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}

            {showAccountingFormsSection && (
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
                  links={visibleAccountingFormLinks}
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
            {showGoldBasicSection && (
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
                  links={visibleGoldBasicLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}

            {showGoldFormsSection && (
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
                  links={visibleGoldFormLinks}
                  translateLinkLabel={translateLinkLabel}
                />
              </SidebarSection>
            )}
          </SidebarSection>
        )}
        {showSettingsSection && (
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
              links={visibleSettingsLinks}
              translateLinkLabel={translateLinkLabel}
            />
          </SidebarSection>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
