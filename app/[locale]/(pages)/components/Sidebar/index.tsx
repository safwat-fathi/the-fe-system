"use client";

import {
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalculatorIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  HomeIcon,
  TagIcon,
  UserGroupIcon,
  LinkIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const mainLinks = [
  {
    name: "الرئيسية",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />,
  },
];

const settingsLinks = [
  {
    name: "إعدادات النظام",
    href: "/settings",
    icon: <Cog6ToothIcon className="h-5 w-5" />,
  },
  {
    name: "فروع ومراكز المستخدم",
    href: "/settings/user-assignments",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    name: "الصلاحيات",
    href: "/settings/permissions",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    name: "الضرائب",
    href: "/settings/taxes",
    icon: <DocumentCheckIcon className="h-5 w-5" />,
  },
  {
    name: "خدمات الربط",
    href: "/settings/integrations",
    icon: <LinkIcon className="h-5 w-5" />,
  },
];

// نظام الحسابات
const accountingBasicLinks = [
  {
    name: "الحسابات",
    href: "/basic/accounts",
    icon: <BanknotesIcon className="h-5 w-5" />,
  },
  {
    name: "مراكز التكلفة",
    href: "/basic/cost-centers",
    icon: <CalculatorIcon className="h-5 w-5" />,
  },
  {
    name: "الصناديق",
    href: "/basic/boxes",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "العملات",
    href: "/basic/currencies",
    icon: <BanknotesIcon className="h-5 w-5" />,
  },
];

const accountingFormLinks: Array<{
  name: string;
  href: string;
  icon: React.ReactNode;
}> = [
  {
    name: "قيد افتتاحي",
    href: "/forms/balance",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند قبض",
    href: "/forms/voucher1",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند صرف",
    href: "/forms/voucher2",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "قيد تسوية",
    href: "/forms/voucher?mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
];

// تم نقل جميع التقارير إلى قسم منفصل في المنتصف

// نظام الذهب
const goldBasicLinks = [
  {
    name: "العملاء",
    href: "/basic/customers",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    name: "أنواع العملاء",
    href: "/basic/cust_type",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    name: "الأصناف",
    href: "/basic/items",
    icon: <CubeIcon className="h-5 w-5" />,
  },
  {
    name: "الفئات",
    href: "/basic/categories",
    icon: <TagIcon className="h-5 w-5" />,
  },
  {
    name: "الوحدات",
    href: "/basic/units",
    icon: <TagIcon className="h-5 w-5" />,
  },
];

const goldFormLinks = [
  {
    name: "فواتير الشراء",
    href: "/forms/invoices?type=purchase&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "فواتير مردود الشراء",
    href: "/forms/invoices?type=purchase-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "فواتير البيع",
    href: "/forms/invoices?type=sale&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "فواتير مردود البيع",
    href: "/forms/invoices?type=sale-return&mode=new",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند قبض عميل",
    href: "/forms/gvoucher4",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند صرف عميل",
    href: "/forms/gvoucher5",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند استلام",
    href: "/forms/receipt",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "سند تسليم",
    href: "/forms/delivery",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
];

// تم نقل جميع التقارير إلى قسم منفصل في المنتصف

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [version] = useState("ver.251103");

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
  
  // Helper function to check if a link is active
  const isLinkActive = (href: string): boolean => {
    try {
      // Extract path and query from href
      const [linkPath, linkQuery] = href.split("?");
      
      // Check if pathname matches exactly
      if (pathname === linkPath) {
        // If href has query params, check them
        if (linkQuery && searchParams) {
          const linkParams = new URLSearchParams(linkQuery);
          
          // Check if all query params in href exist in current params with matching values
          for (const [key, value] of linkParams.entries()) {
            const currentValue = searchParams.get(key);
            // If query param value doesn't match, link is not active
            if (currentValue !== value) {
              return false;
            }
          }
        }
        // Pathname matches exactly and query params (if any) match, link is active
        return true;
      }

      // If pathname doesn't match exactly, link is not active
      // This ensures that parent links (like /settings) are not active when on child pages (like /settings/permissions)
      return false;
    } catch (error) {
      console.warn("Error checking link active state:", error);
      // Fallback to simple pathname comparison
      const [linkPath] = href.split("?");
      return pathname === linkPath;
    }
  };


  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.3, ease: "easeInOut", delay: 0.05 };

  return (
    <aside
      className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen ${
        isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
      } shadow-[4px_0_20px_rgba(0,0,0,0.4)] border-r border-amber-900/20`}
    >
      {/* Header */}
      <div className="relative border-b border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-transparent to-transparent rounded-b-xl">
        <div className={`flex items-center h-16 mb-3 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
          {isSidebarOpen && (
            <div className="flex items-center relative">
              <h2 className="text-4xl font-black whitespace-nowrap relative">
                <span 
                  className="relative inline-block gradient-text-animated"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.6)) drop-shadow(0 0 15px rgba(180, 83, 9, 0.4))',
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
            variant="light"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
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
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
        </div>

      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Links */}
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            className={clsx(
              "flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group backdrop-blur-sm",
              {
                "bg-gradient-to-r from-amber-600/80 to-amber-700/80 shadow-lg shadow-amber-900/30":
                  isLinkActive(link.href),
                "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40": !isLinkActive(link.href),
              },
            )}
            href={link.href}
          >
            <div
              className={clsx("text-lg transition-all", {
                "text-white drop-shadow-lg": isLinkActive(link.href),
                "text-slate-300 group-hover:text-white": !isLinkActive(link.href),
              })}
            >
              {link.icon}
            </div>
            <span
              className={clsx("font-medium", {
                block: isSidebarOpen,
                hidden: !isSidebarOpen,
              })}
            >
              {link.name}
            </span>
          </Link>
        ))}

        {/* نظام الحسابات */}
        <div className="mt-4">
          <div
            className="px-3 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer flex justify-between items-center hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => setShowAccountingSystem(!showAccountingSystem)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
              نظام الحسابات
            </span>
            {isSidebarOpen && (
              <div className="text-slate-400">
                {showAccountingSystem ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showAccountingSystem && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden mt-2"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {/* البيانات الأساسية - نظام الحسابات */}
                <div
                  className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                  onClick={() => setShowAccountingBasic(!showAccountingBasic)}
                >
                  <span
                    className={clsx({
                      block: isSidebarOpen,
                      hidden: !isSidebarOpen,
                    })}
                  >
                    البيانات الأساسية
                  </span>
                  {isSidebarOpen && (
                    <div className="text-slate-500">
                      {showAccountingBasic ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {showAccountingBasic && (
                    <motion.div
                      animate="visible"
                      className="flex flex-col overflow-hidden"
                      exit="hidden"
                      initial="hidden"
                      transition={transition}
                      variants={animationVariants}
                    >
                      {accountingBasicLinks.map((link) => (
                        <Link
                          key={link.href}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                            isLinkActive(link.href)
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
                          }`}
                          href={link.href}
                          prefetch={true}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">
                            {link.icon}
                          </div>
                          <span
                            className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}
                          >
                            {link.name}
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* النماذج - نظام الحسابات */}
                {accountingFormLinks.length > 0 && (
                  <>
                    <div
                      className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                      onClick={() =>
                        setShowAccountingForms(!showAccountingForms)
                      }
                    >
                      <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                        النماذج
                      </span>
                      {isSidebarOpen && (
                        <div className="text-slate-500">
                          {showAccountingForms ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {showAccountingForms && (
                        <motion.div
                          animate="visible"
                          className="flex flex-col overflow-hidden"
                          exit="hidden"
                          initial="hidden"
                          transition={transition}
                          variants={animationVariants}
                        >
                          {accountingFormLinks.map((link) => (
                            <Link
                              key={link.href}
                              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                                pathname === link.href
                                  ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                                  : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
                              }`}
                              href={link.href}
                              style={{
                                paddingLeft: isSidebarOpen
                                  ? "2.5rem"
                                  : "0.75rem",
                              }}
                            >
                              <div className="text-sm transition-all">
                                {link.icon}
                              </div>
                              <span
                                className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}
                              >
                                {link.name}
                              </span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* التقارير - قسم منفصل في المنتصف */}
        <div className="mt-4">
          <Link
            className={clsx(
              "flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group backdrop-blur-sm",
              {
                "bg-gradient-to-r from-amber-600/80 to-amber-700/80 shadow-lg shadow-amber-900/30":
                  pathname.startsWith("/reports"),
                "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40":
                  !pathname.startsWith("/reports"),
              },
            )}
            href="/reports"
          >
            <div
              className={clsx("text-lg transition-all", {
                "text-white drop-shadow-lg": pathname.startsWith("/reports"),
                "text-slate-300 group-hover:text-white":
                  !pathname.startsWith("/reports"),
              })}
            >
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <span
              className={clsx("font-medium", {
                block: isSidebarOpen,
                hidden: !isSidebarOpen,
              })}
            >
              التقارير
            </span>
          </Link>
        </div>

        {/* نظام الذهب */}
        <div className="mt-4">
          <div
            className="px-3 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer flex justify-between items-center hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => setShowGoldSystem(!showGoldSystem)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
              نظام الذهب
            </span>
            {isSidebarOpen && (
              <div className="text-slate-400">
                {showGoldSystem ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showGoldSystem && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden mt-2"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {/* البيانات الأساسية - نظام الذهب */}
                <div
                  className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                  onClick={() => setShowGoldBasic(!showGoldBasic)}
                >
                  <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                    البيانات الأساسية
                  </span>
                  {isSidebarOpen && (
                    <div className="text-slate-500">
                      {showGoldBasic ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {showGoldBasic && (
                    <motion.div
                      animate="visible"
                      className="flex flex-col overflow-hidden"
                      exit="hidden"
                      initial="hidden"
                      transition={transition}
                      variants={animationVariants}
                    >
                      {goldBasicLinks.map((link) => (
                        <Link
                          key={link.href}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                            isLinkActive(link.href)
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
                          }`}
                          href={link.href}
                          prefetch={true}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">
                            {link.icon}
                          </div>

                          <span
                            className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}
                          >
                            {link.name}
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* النماذج - نظام الذهب */}
                <div
                  className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                  onClick={() => setShowGoldForms(!showGoldForms)}
                >
                  <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                    النماذج
                  </span>
                  {isSidebarOpen && (
                    <div className="text-slate-500">
                      {showGoldForms ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {showGoldForms && (
                    <motion.div
                      animate="visible"
                      className="flex flex-col overflow-hidden"
                      exit="hidden"
                      initial="hidden"
                      transition={transition}
                      variants={animationVariants}
                    >
                      {goldFormLinks.map((link) => (
                        <Link
                          key={link.href}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                            isLinkActive(link.href)
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
                          }`}
                          href={link.href}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">
                            {link.icon}
                          </div>
                          <span
                            className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}
                          >
                            {link.name}
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* الإعدادات */}
        <div className="mt-4">
          <div
            className="px-3 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer flex justify-between items-center hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => setShowSettingsLinks(!showSettingsLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
              الإعدادات
            </span>
            {isSidebarOpen && (
              <div className="text-slate-400">
                {showSettingsLinks ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showSettingsLinks && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden mt-2"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {settingsLinks.map((link) => (
                  <Link
                    key={link.href}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                      isLinkActive(link.href)
                        ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                        : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
                    }`}
                    href={link.href}
                    style={{
                      paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                    }}
                  >
                    <div className="text-sm transition-all">
                      {link.icon}
                    </div>
                    <span
                      className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}
                    >
                      {link.name}
                    </span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
