"use client";


import type { SidebarLinkConfig } from "./sidebarTypes";
import type { TranslateLinkLabel } from "./sidebarUtils";

import Link from "next/link";

type SidebarLinkListProps = {
  links: SidebarLinkConfig[];
  isSidebarOpen: boolean;
  isLinkActive: (href: string) => boolean;
  translateLinkLabel: TranslateLinkLabel;
  indent?: string;
};

const SidebarLinkList = ({
  links,
  isSidebarOpen,
  isLinkActive,
  translateLinkLabel,
  indent,
}: SidebarLinkListProps) => (
  <>
    {links.map((link) => (
      <Link
        key={link.href}
        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-white no-underline group backdrop-blur-sm ${
          isLinkActive(link.href)
            ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 text-amber-100 border border-amber-600/40 shadow-sm"
            : "hover:bg-white/5 hover:shadow-lg hover:shadow-black/40 text-slate-300 hover:text-white hover:border-transparent"
        }`}
        href={link.href}
        prefetch={link.prefetch}
        style={
          indent
            ? { paddingLeft: isSidebarOpen ? indent : "0.75rem" }
            : undefined
        }
      >
        <div className="text-sm transition-all">{link.icon}</div>
        <span className={`${isSidebarOpen ? "block" : "hidden"} text-sm font-medium`}>
          {translateLinkLabel(link)}
        </span>
      </Link>
    ))}
  </>
);

export default SidebarLinkList;
