import type { ReadonlyURLSearchParams } from "next/navigation";
import type { SidebarLinkConfig } from "./sidebarTypes";

export const doQueriesMatch = (
  searchParams: ReadonlyURLSearchParams | null,
  linkQuery?: string,
) => {
  if (!linkQuery || !searchParams) return true;

  const linkParams = new URLSearchParams(linkQuery);

  for (const [key, value] of linkParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
};

export const createIsLinkActive =
  (pathname: string, searchParams: ReadonlyURLSearchParams | null) =>
  (href: string): boolean => {
    const [linkPath, linkQuery] = href.split("?");

    const pathMatches =
      pathname === linkPath ||
      pathname.endsWith(linkPath) ||
      pathname.replace(/^\/[^/]+/, "") === linkPath;

    if (!pathMatches) return false;

    return doQueriesMatch(searchParams, linkQuery);
  };

export type TranslateLinkLabel = (link: SidebarLinkConfig) => string;
