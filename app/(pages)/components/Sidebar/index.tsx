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
  SignalIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    name: "قيد تسوية",
    href: "/forms/voucher?mode=new",
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

const accountingReportLinks: Array<{
  name: string;
  href: string;
  icon: React.ReactNode;
}> = [
  {
    name: "تقرير السندات",
    href: "/reports/vouchers",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "كشف حساب",
    href: "/reports/account-statement",
    icon: <CalculatorIcon className="h-5 w-5" />,
  },
  {
    name: "قائمة الدخل",
    href: "/reports/income-statement",
    icon: <CalculatorIcon className="h-5 w-5" />,
  },
];

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
];

const goldReportLinks = [
  {
    name: "قائمة الفواتير",
    href: "/reports/invoices",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    name: "تقرير الضريبة",
    href: "/reports/vat",
    icon: <CalculatorIcon className="h-5 w-5" />,
  },
];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [version] = useState("ver.251103");

  // نظام الحسابات
  const [showAccountingSystem, setShowAccountingSystem] = useState(true);
  const [showAccountingBasic, setShowAccountingBasic] = useState(true);
  const [showAccountingForms, setShowAccountingForms] = useState(true);
  const [showAccountingReports, setShowAccountingReports] = useState(false);

  // نظام الذهب
  const [showGoldSystem, setShowGoldSystem] = useState(true);
  const [showGoldBasic, setShowGoldBasic] = useState(true);
  const [showGoldForms, setShowGoldForms] = useState(true);
  const [showGoldReports, setShowGoldReports] = useState(true);

  const [showSettingsLinks, setShowSettingsLinks] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.3, ease: "easeInOut", delay: 0.05 };

  return (
    <aside
      className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
      } min-h-screen shadow-[4px_0_20px_rgba(0,0,0,0.4)] border-r border-amber-900/20`}
    >
      {/* Header */}
      <div className="relative border-b border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-transparent to-transparent rounded-b-xl">
        <div className="flex items-center justify-between h-16 mb-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center shadow-lg ring-2 ring-amber-500/30">
                <span className="text-xl font-bold text-white drop-shadow-md">ن</span>
              </div>
              <h2 className="text-xl font-bold whitespace-nowrap text-amber-50 drop-shadow-sm">
                نفيس
              </h2>
            </div>
          )}
          <Button
            className="text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            size="sm"
            variant="light"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
        </div>

        {/* Status and Version */}
        {isSidebarOpen && (
          <div className="pb-4 px-1">
            <div className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-amber-900/20">
              <div className="relative flex items-center gap-2">
                <div className="relative w-2 h-2 rounded-full">
                  <div className={`absolute inset-0 rounded-full ${isOnline ? "bg-green-400" : "bg-red-400"} ${isOnline ? "animate-soft-pulse" : ""}`}></div>
                  {isOnline && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-soft-ping"></div>
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-soft-ping" style={{ animationDelay: "1.5s" }}></div>
                    </>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isOnline ? "text-green-300" : "text-red-300"}`}>
                  {isOnline ? "متصل" : "غير متصل"}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                {version}
              </span>
            </div>
          </div>
        )}
        {!isSidebarOpen && (
          <div className="pb-2 flex justify-center">
            <div className="relative w-2 h-2 rounded-full">
              <div className={`absolute inset-0 rounded-full ${isOnline ? "bg-green-400" : "bg-red-400"} ${isOnline ? "animate-soft-pulse" : ""}`}></div>
              {isOnline && (
                <>
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-soft-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-soft-ping" style={{ animationDelay: "1.5s" }}></div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {/* Main Links */}
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            className={clsx(
              "flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group backdrop-blur-sm",
              {
                "bg-gradient-to-r from-amber-600/80 to-amber-700/80 shadow-lg shadow-amber-900/30": pathname === link.href,
                "hover:bg-white/5 hover:shadow-sm": pathname !== link.href,
              },
            )}
            href={link.href}
          >
            <div
              className={clsx("text-lg transition-all", {
                "text-white drop-shadow-lg": pathname === link.href,
                "text-slate-300 group-hover:text-white": pathname !== link.href,
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
                            pathname === link.href
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 text-slate-300 hover:text-white hover:border-transparent"
                          }`}
                          href={link.href}
                          prefetch={true}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">{link.icon}</div>
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
                                  : "hover:bg-white/5 text-slate-300 hover:text-white"
                              }`}
                              href={link.href}
                              style={{
                                paddingLeft: isSidebarOpen
                                  ? "2.5rem"
                                  : "0.75rem",
                              }}
                            >
                              <div className="text-sm transition-all">{link.icon}</div>
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

                {/* التقارير - نظام الحسابات */}
                {accountingReportLinks.length > 0 && (
                  <>
                    <div
                      className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                      onClick={() =>
                        setShowAccountingReports(!showAccountingReports)
                      }
                    >
                      <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                        التقارير
                      </span>
                      {isSidebarOpen && (
                        <div className="text-slate-500">
                          {showAccountingReports ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {showAccountingReports && (
                        <motion.div
                          animate="visible"
                          className="flex flex-col overflow-hidden"
                          exit="hidden"
                          initial="hidden"
                          transition={transition}
                          variants={animationVariants}
                        >
                          {accountingReportLinks.map((link) => (
                            <Link
                              key={link.href}
                              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                                pathname === link.href
                                  ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                                  : "hover:bg-white/5 text-slate-300 hover:text-white"
                              }`}
                              href={link.href}
                              style={{
                                paddingLeft: isSidebarOpen
                                  ? "2.5rem"
                                  : "0.75rem",
                              }}
                            >
                              <div className="text-sm transition-all">{link.icon}</div>
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
                            pathname === link.href
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 text-slate-300 hover:text-white"
                          }`}
                          href={link.href}
                          prefetch={true}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">{link.icon}</div>

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
                            pathname === link.href
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 text-slate-300 hover:text-white"
                          }`}
                          href={link.href}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">{link.icon}</div>
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

                {/* التقارير - نظام الذهب */}
                <div
                  className="px-3 py-2 text-xs text-slate-400 cursor-pointer flex justify-between items-center hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
                  onClick={() => setShowGoldReports(!showGoldReports)}
                >
                  <span className={`${isSidebarOpen ? "block" : "hidden"}`}>
                    التقارير
                  </span>
                  {isSidebarOpen && (
                    <div className="text-slate-500">
                      {showGoldReports ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {showGoldReports && (
                    <motion.div
                      animate="visible"
                      className="flex flex-col overflow-hidden"
                      exit="hidden"
                      initial="hidden"
                      transition={transition}
                      variants={animationVariants}
                    >
                      {goldReportLinks.map((link) => (
                        <Link
                          key={link.href}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
                            pathname === link.href
                              ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
                              : "hover:bg-white/5 text-slate-300 hover:text-white"
                          }`}
                          href={link.href}
                          style={{
                            paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem",
                          }}
                        >
                          <div className="text-sm transition-all">{link.icon}</div>
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
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group backdrop-blur-sm ${
                      pathname === link.href
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20"
                        : "hover:bg-white/5 hover:shadow-sm"
                    }`}
                    href={link.href}
                  >
                    <div
                      className={`text-lg transition-all ${pathname === link.href ? "text-white drop-shadow-lg" : "text-slate-300 group-hover:text-white"}`}
                    >
                      {link.icon}
                    </div>
                    <span
                      className={`${isSidebarOpen ? "block" : "hidden"} font-medium`}
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
