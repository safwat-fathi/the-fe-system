"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import UserHeader from "@/components/UserHeader";
import { Bars3Icon, HomeIcon, BanknotesIcon, UserGroupIcon, CubeIcon, TagIcon, DocumentTextIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, ReceiptRefundIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

const mainLinks = [{ name: "الرئيسية", href: "/dashboard", icon: <HomeIcon className="h-5 w-5" /> }];

const settingsLinks = [
  { name: "إعدادات النظام", href: "/dashboard/settings", icon: <Cog6ToothIcon className="h-5 w-5" /> },
];

// نظام الحسابات
const accountingBasicLinks = [
  { name: "الحسابات", href: "/dashboard/basic/accounts", icon: <BanknotesIcon className="h-5 w-5" /> },
  { name: "مراكز التكلفة", href: "/dashboard/basic/cost-centers", icon: <CalculatorIcon className="h-5 w-5" /> },
  { name: "الصناديق", href: "/dashboard/basic/boxes", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: "العملات", href: "/dashboard/basic/currencies", icon: <BanknotesIcon className="h-5 w-5" /> },
];

const accountingFormLinks: Array<{ name: string; href: string; icon: React.ReactNode }> = [
          { name: "قيد تسوية", href: "/dashboard/forms/voucher", icon: <DocumentTextIcon className="h-5 w-5" /> },
          { name: "قيد افتتاحي", href: "/dashboard/forms/balance", icon: <DocumentTextIcon className="h-5 w-5" /> },
];

const accountingReportLinks: Array<{ name: string; href: string; icon: React.ReactNode }> = [
  { name: "تقرير السندات", href: "/dashboard/reports/vouchers", icon: <DocumentTextIcon className="h-5 w-5" /> },
];

// نظام الذهب
const goldBasicLinks = [
  { name: "العملاء", href: "/dashboard/basic/customers", icon: <UserGroupIcon className="h-5 w-5" /> },
  { name: "أنواع العملاء", href: "/dashboard/basic/cust_type", icon: <UserGroupIcon className="h-5 w-5" /> },
  { name: "الأصناب", href: "/dashboard/basic/items", icon: <CubeIcon className="h-5 w-5" /> },
  { name: "الفئات", href: "/dashboard/basic/categories", icon: <TagIcon className="h-5 w-5" /> },
  { name: "الوحدات", href: "/dashboard/basic/units", icon: <TagIcon className="h-5 w-5" /> },
];

const goldFormLinks = [
  { name: "فواتير الشراء", href: "/dashboard/forms/invoices/Gold_invoice1?new=true", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: "فواتير مردود الشراء", href: "/dashboard/forms/invoices/Gold_invoice3?new=true", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: "فواتير البيع", href: "/dashboard/forms/invoices/Gold_invoice2?new=true", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: "فواتير مردود البيع", href: "/dashboard/forms/invoices/Gold_invoice4", icon: <DocumentTextIcon className="h-5 w-5" /> },
];

const goldReportLinks = [
  { name: "قائمة الفواتير", href: "/dashboard/reports/invoices", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: "تقرير الضريبة", href: "/dashboard/reports/vat", icon: <CalculatorIcon className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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

  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.3, ease: "easeInOut", delay: 0.05 };

  return (
    <div className="font-cairo flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-gradient-to-b from-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
        } min-h-screen shadow-xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 mb-8 relative border-b border-gray-700 pb-4">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold whitespace-nowrap text-white">لوحة التحكم</h2>
          )}
          <Button
            size="sm"
            variant="light"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:bg-gray-700"
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {/* Main Links */}
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group ${
                pathname === link.href 
                  ? "bg-blue-600 shadow-lg" 
                  : "hover:bg-gray-700 hover:shadow-md"
              }`}
            >
              <div className={`text-lg ${pathname === link.href ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                {link.icon}
              </div>
              <span className={`${isSidebarOpen ? "block" : "hidden"} font-medium`}>{link.name}</span>
            </Link>
          ))}

          {/* نظام الحسابات */}
          <div className="mt-6">
            <div
              className="px-3 py-2 text-sm font-semibold text-gray-300 cursor-pointer flex justify-between items-center hover:text-white transition-colors"
              onClick={() => setShowAccountingSystem(!showAccountingSystem)}
            >
              <span className={`${isSidebarOpen ? "block" : "hidden"}`}>نظام الحسابات</span>
              {isSidebarOpen && (
                <div className="text-gray-400">
                  {showAccountingSystem ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
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
                    className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                    onClick={() => setShowAccountingBasic(!showAccountingBasic)}
                  >
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>البيانات الأساسية</span>
                    {isSidebarOpen && (
                      <div className="text-gray-500">
                        {showAccountingBasic ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
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
                            href={link.href}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                              pathname === link.href 
                                ? "bg-blue-600/20 text-blue-300" 
                                : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                            }`}
                            style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                          >
                            <div className="text-sm">{link.icon}</div>
                            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* النماذج - نظام الحسابات */}
                  {accountingFormLinks.length > 0 && (
                    <>
                      <div
                        className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                        onClick={() => setShowAccountingForms(!showAccountingForms)}
                      >
                        <span className={`${isSidebarOpen ? "block" : "hidden"}`}>النماذج</span>
                        {isSidebarOpen && (
                          <div className="text-gray-500">
                            {showAccountingForms ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
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
                                href={link.href}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                                  pathname === link.href 
                                    ? "bg-blue-600/20 text-blue-300" 
                                    : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                                }`}
                                style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                              >
                                <div className="text-sm">{link.icon}</div>
                                <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
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
                        className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                        onClick={() => setShowAccountingReports(!showAccountingReports)}
                      >
                        <span className={`${isSidebarOpen ? "block" : "hidden"}`}>التقارير</span>
                        {isSidebarOpen && (
                          <div className="text-gray-500">
                            {showAccountingReports ? <FaChevronUp /> : <FaChevronDown />}
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
                                href={link.href}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                                  pathname === link.href 
                                    ? "bg-blue-600/20 text-blue-300" 
                                    : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                                }`}
                                style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                              >
                                <div className="text-sm">{link.icon}</div>
                                <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
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
          <div className="mt-6">
            <div
              className="px-3 py-2 text-sm font-semibold text-gray-300 cursor-pointer flex justify-between items-center hover:text-white transition-colors"
              onClick={() => setShowGoldSystem(!showGoldSystem)}
            >
              <span className={`${isSidebarOpen ? "block" : "hidden"}`}>نظام الذهب</span>
              {isSidebarOpen && (
                <div className="text-gray-400">
                  {showGoldSystem ? <FaChevronUp /> : <FaChevronDown />}
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
                    className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                    onClick={() => setShowGoldBasic(!showGoldBasic)}
                  >
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>البيانات الأساسية</span>
                    {isSidebarOpen && (
                      <div className="text-gray-500">
                        {showGoldBasic ? <FaChevronUp /> : <FaChevronDown />}
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
                            href={link.href}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                              pathname === link.href 
                                ? "bg-blue-600/20 text-blue-300" 
                                : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                            }`}
                            style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                          >
                            <div className="text-sm">{link.icon}</div>
                            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* النماذج - نظام الذهب */}
                  <div
                    className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                    onClick={() => setShowGoldForms(!showGoldForms)}
                  >
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>النماذج</span>
                    {isSidebarOpen && (
                      <div className="text-gray-500">
                        {showGoldForms ? <FaChevronUp /> : <FaChevronDown />}
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
                            href={link.href}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                              pathname === link.href 
                                ? "bg-blue-600/20 text-blue-300" 
                                : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                            }`}
                            style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                          >
                            <div className="text-sm">{link.icon}</div>
                            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* التقارير - نظام الذهب */}
                  <div
                    className="px-3 py-2 text-xs text-gray-400 cursor-pointer flex justify-between items-center hover:text-gray-200 transition-colors"
                    onClick={() => setShowGoldReports(!showGoldReports)}
                  >
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>التقارير</span>
                    {isSidebarOpen && (
                      <div className="text-gray-500">
                        {showGoldReports ? <FaChevronUp /> : <FaChevronDown />}
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
                            href={link.href}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline group ${
                              pathname === link.href 
                                ? "bg-blue-600/20 text-blue-300" 
                                : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                            }`}
                            style={{ paddingLeft: isSidebarOpen ? "2.5rem" : "0.75rem" }}
                          >
                            <div className="text-sm">{link.icon}</div>
                            <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm`}>{link.name}</span>
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
          <div className="mt-6">
            <div
              className="px-3 py-2 text-sm font-semibold text-gray-300 cursor-pointer flex justify-between items-center hover:text-white transition-colors"
              onClick={() => setShowSettingsLinks(!showSettingsLinks)}
            >
              <span className={`${isSidebarOpen ? "block" : "hidden"}`}>الإعدادات</span>
              {isSidebarOpen && (
                <div className="text-gray-400">
                  {showSettingsLinks ? <FaChevronUp /> : <FaChevronDown />}
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
                      href={link.href}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group ${
                        pathname === link.href 
                          ? "bg-blue-600 shadow-lg" 
                          : "hover:bg-gray-700 hover:shadow-md"
                      }`}
                    >
                      <div className={`text-lg ${pathname === link.href ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        {link.icon}
                      </div>
                      <span className={`${isSidebarOpen ? "block" : "hidden"} font-medium`}>{link.name}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* زر الخروج */}
          <div className="mt-auto pt-6 border-t border-gray-700">
            <div className="flex justify-center">
              <LogoutButton />
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen overflow-auto">
        <AuthGuard>
          <UserHeader />
          <div className="p-8">
            {children}
          </div>
        </AuthGuard>
      </main>
    </div>
  );
}
