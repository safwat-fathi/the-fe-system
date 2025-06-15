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
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

const mainLinks = [
  { name: "الرئيسية", href: "/dashboard", icon: <FaHome /> },
];

const dataLinks = [
  { name: "الحسابات", href: "/dashboard/accounts", icon: <FaMoneyBill /> },
  { name: "العملات", href: "/dashboard/currencies", icon: <FaMoneyBill /> },
  { name: "العملاء", href: "/dashboard/customers", icon: <FaUsers /> },
  { name: "الأصناف", href: "/dashboard/items", icon: <FaBoxOpen /> },
  { name: "الفئات", href: "/dashboard/categories", icon: <FaTags /> },
  { name: "الوحدات", href: "/dashboard/units", icon: <FaTags /> },
  // { name: "صناديق الفواتير", href: "/dashboard/invoice_box", icon: <FaTags /> },

];

const formLinks = [
  { name: "فاتورة البيع", href: "/dashboard/invoice", icon: <FaFileAlt /> },
  { name: "قائمة الفواتير", href: "/dashboard/invoices", icon: <FaFileAlt /> },
  // {
  //   name: "طريقة الدفع",
  //   href: "/dashboard/invoice_payment",
  //   icon: <FaMoneyBill />,
  // },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDataLinks, setShowDataLinks] = useState(true);
  const [showFormLinks, setShowFormLinks] = useState(true);
  const pathname = usePathname();

  const animationVariants = {
    hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
    visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
  };

  const transition = { duration: 0.7, ease: "easeInOut", delay: 0.05 };

  return (
    <div className="font-cairo flex min-h-screen bg-gray-100">
      <aside className={`bg-gray-800 text-white p-4 transition-all ${isSidebarOpen ? "w-64" : "w-16"} min-h-screen`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-semibold transition-all ${isSidebarOpen ? "block" : "hidden"}`}>لوحة التحكم</h2>
          <Button variant="light" size="sm" onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars />
          </Button>
        </div>

        <nav className="flex flex-col gap-2">
          {/* روابط رئيسية */}
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"}`}
            >
              {link.icon}
              <span className={`${isSidebarOpen ? "block" : "hidden"}`}>{link.name}</span>
            </Link>
          ))}

          {/* البيانات الأساسية */}
          <div
            className="mt-4 px-2 text-sm text-gray-400 cursor-pointer flex justify-between items-center"
            onClick={() => setShowDataLinks(!showDataLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>البيانات الأساسية</span>
            {isSidebarOpen && (showDataLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showDataLinks && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={animationVariants}
                transition={transition}
                className="flex flex-col overflow-hidden"
              >
                {dataLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"}`}
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
            className="mt-4 px-2 text-sm text-gray-400 cursor-pointer flex justify-between items-center"
            onClick={() => setShowFormLinks(!showFormLinks)}
          >
            <span className={`${isSidebarOpen ? "block" : "hidden"}`}>النماذج</span>
            {isSidebarOpen && (showFormLinks ? <FaChevronUp /> : <FaChevronDown />)}
          </div>

          <AnimatePresence initial={false}>
            {showFormLinks && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={animationVariants}
                transition={transition}
                className="flex flex-col overflow-hidden"
              >
                {formLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${pathname === link.href ? "bg-gray-700" : "hover:bg-gray-700"}`}
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

      <main className="flex-1 w-full min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
