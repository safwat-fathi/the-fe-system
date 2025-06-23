"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import {
  FaBars,
  FaHome,
  FaMoneyBill,
  FaUsers,
  FaBoxOpen,
  FaTags,
  FaFileAlt,
  FaCog,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

const mainLinks = [{ name: "الرئيسية", href: "/dashboard", icon: <FaHome /> }];

const settingsLinks = [
  { name: "إعدادات النظام", href: "/dashboard/settings", icon: <FaCog /> },
];

const dataLinks = [
  { name: "الحسابات", href: "/dashboard/basic/accounts", icon: <FaMoneyBill /> },
  { name: "العملات", href: "/dashboard/basic/currencies", icon: <FaMoneyBill /> },
  { name: "العملاء", href: "/dashboard/basic/customers", icon: <FaUsers /> },
  { name: "الأصناف", href: "/dashboard/basic/items", icon: <FaBoxOpen /> },
  { name: "الفئات", href: "/dashboard/basic/categories", icon: <FaTags /> },
  { name: "الوحدات", href: "/dashboard/basic/units", icon: <FaTags /> },
];

const formLinks = [
  { name: "فاتورة البيع", href: "/dashboard/forms/invoice", icon: <FaFileAlt /> },
];

const reportLinks = [
  { name: "قائمة الفواتير", href: "/dashboard/reports/invoices", icon: <FaFileAlt /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDataLinks, setShowDataLinks] = useState(true);
  const [showFormLinks, setShowFormLinks] = useState(true);
  const [showSettingsLinks, setShowSettingsLinks] = useState(true);
  const [showReportLinks, setShowReportLinks] = useState(true);
  const pathname = usePathname();

  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.7, ease: "easeInOut", delay: 0.05 };

  return (
    <div className="font-cairo flex min-h-screen bg-gray-100">
      <aside
        className={`bg-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "w-64 px-4" : "w-16 px-2"
        } min-h-screen`}
      >
        <div className="flex items-center justify-between h-12 mb-6 relative">
          {isSidebarOpen && (
            <h2 className="text-lg font-semibold whitespace-nowrap">لوحة التحكم</h2>
          )}
          <Button
            size="sm"
            variant="light"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white"
          >
            <FaBars />
          </Button>
        </div>

        <nav className="flex flex-col gap-2">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline ${
                pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              {link.icon}
              <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
            </Link>
          ))}

          {/* البيانات الأساسية */}
          <div
            className="mt-4 px-2 text-sm text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowDataLinks(!showDataLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>البيانات الأساسية</span>
            {isSidebarOpen && (showDataLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showDataLinks && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {dataLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline ${
                      pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    {link.icon}
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* النماذج */}
          <div
            className="mt-4 px-2 text-sm text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowFormLinks(!showFormLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>النماذج</span>
            {isSidebarOpen && (showFormLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showFormLinks && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {formLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline ${
                      pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    {link.icon}
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* التقارير */}
          <div
            className="mt-4 px-2 text-sm text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowReportLinks(!showReportLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>التقارير</span>
            {isSidebarOpen && (showReportLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showReportLinks && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {reportLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline ${
                      pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    {link.icon}
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* الإعدادات */}
          <div
            className="mt-4 px-2 text-sm text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowSettingsLinks(!showSettingsLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>الإعدادات</span>
            {isSidebarOpen && (showSettingsLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showSettingsLinks && (
              <motion.div
                animate="visible"
                className="flex flex-col overflow-hidden"
                exit="hidden"
                initial="hidden"
                transition={transition}
                variants={animationVariants}
              >
                {settingsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all text-white no-underline ${
                      pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    {link.icon}
                    <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </aside>

      <main className="flex-1 w-full min-h-screen p-6">{children}</main>
    </div>
  );
}
