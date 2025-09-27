"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Parser<T> = {
  parse?: (value: string | null) => T | undefined;
  serialize?: (value: T | undefined | null) => string | undefined;
};

type Schema<T extends Record<string, any>> = {
  [K in keyof T]?: Parser<T[K]>;
};

type Options<T extends Record<string, any>> = {
  defaultValues?: Partial<T>;
  schema?: Schema<T>;
  /**
   * How to update the URL when calling setParams / setParam:
   * - "replace" (default): router.replace(...) (no history entry)
   * - "push": router.push(...) (new history entry)
   * - "none": do not call router.push/replace, but the hook still returns the parsed params (useful if you want to call router.push yourself)
   */
  pushMode?: "replace" | "push" | "none";
  /**
   * If true (default), after changing URL the hook will call router.refresh()
   * so server components re-render and fetch new data.
   */
  refreshOnChange?: boolean;
  /**
   * Debounce ms for URL updates (useful for typing into search input). Default 0 (no debounce).
   */
  debounce?: number;
};

type UseQueryParamsReturn<T extends Record<string, any>> = {
  params: T;
  /**
   * Set single param (pass undefined/null to remove param).
   */
  setParam: <K extends keyof T>(key: K, value: T[K] | undefined | null) => void;
  /**
   * Set multiple params at once. Keys with undefined/null will be removed.
   */
  setParams: (next: Partial<T>) => void;
  /**
   * Remove all params and restore defaults.
   */
  reset: () => void;
};

export function useQueryParams<T extends Record<string, any>>(
  keys: (keyof T)[],
  opts: Options<T> = {},
): UseQueryParamsReturn<T> {
  const {
    defaultValues = {} as Partial<T>,
    schema = {} as Schema<T>,
    pushMode = "replace",
    refreshOnChange = true,
    debounce = 0,
  } = opts;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // timer / queued nav for debounce
  const timerRef = useRef<number | null>(null);
  const pendingNavRef = useRef<{
    url: string;
    method: "push" | "replace" | "none";
  } | null>(null);

  // Build current params object from searchParams + schema + defaults
  const params = useMemo(() => {
    const out = {} as T;
    for (const key of keys) {
      const raw = searchParams?.get(String(key)) ?? null;
      const p = schema?.[key as string] as Parser<any> | undefined;
      let value;
      if (p?.parse) {
        value = p.parse(raw);
      } else {
        // default parsing heuristics
        if (raw === null) value = undefined;
        else value = raw;
      }
      if (value === undefined) {
        // fallback to supplied default if any
        if (
          defaultValues &&
          Object.prototype.hasOwnProperty.call(defaultValues, key)
        ) {
          value = (defaultValues as any)[key];
        }
      }
      (out as any)[key] = value;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    JSON.stringify(defaultValues),
    JSON.stringify(schema),
    keys.join(","),
  ]);

  // helper to convert value -> serialized string
  const serializeValue = useCallback(
    (k: keyof T, v: any): string | undefined => {
      const p = schema?.[k as string] as Parser<any> | undefined;
      if (p?.serialize) return p.serialize(v);
      if (v == null) return undefined;
      // arrays serialize to comma list
      if (Array.isArray(v)) return v.join(",");
      return String(v);
    },
    [schema],
  );

  // build a URL string given a "next" partial params
  const buildUrl = useCallback(
    (next: Partial<T>) => {
      const current = new URLSearchParams(searchParams?.toString() ?? "");
      // apply next values: if undefined/null delete, otherwise set
      for (const k of keys) {
        if (!Object.prototype.hasOwnProperty.call(next, k)) continue;
        const rawVal = (next as any)[k];
        const serialized = serializeValue(k, rawVal);
        if (
          serialized === undefined ||
          serialized === null ||
          serialized === ""
        ) {
          current.delete(String(k));
        } else {
          current.set(String(k), serialized);
        }
      }
      // ensure defaults: if a default value exists and result lacks the key, do not insert it;
      // keeping URL minimal is often desirable. (If you want defaults persisted in URL, change here.)
      const qs = current.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [keys, pathname, searchParams, serializeValue],
  );

  // perform navigation; uses pushMode and optionally refresh
  const doNavigate = useCallback(
    (url: string) => {
      if (pushMode === "none") {
        // store pending nav (for debounce) but do not call router
        pendingNavRef.current = { url, method: "none" };
        return;
      }

      const method = pushMode === "push" ? "push" : "replace";
      if (debounce > 0) {
        // schedule debounce
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          if (method === "push") router.push(url);
          else router.replace(url);
          if (refreshOnChange) router.refresh();
          timerRef.current = null;
          pendingNavRef.current = null;
        }, debounce);
        // store pending nav
        pendingNavRef.current = { url, method };
      } else {
        if (method === "push") router.push(url);
        else router.replace(url);
        if (refreshOnChange) router.refresh();
      }
    },
    [debounce, pushMode, refreshOnChange, router],
  );

  const setParam = useCallback(
    <K extends keyof T>(key: K, value: T[K] | undefined | null) => {
      const url = buildUrl({ [key]: value } as Partial<T>);
      doNavigate(url);
    },
    [buildUrl, doNavigate],
  );

  const setParams = useCallback(
    (next: Partial<T>) => {
      const url = buildUrl(next);
      doNavigate(url);
    },
    [buildUrl, doNavigate],
  );

  const reset = useCallback(() => {
    // remove all keys in schema from URL
    const current = new URLSearchParams(searchParams?.toString() ?? "");
    for (const k of keys) current.delete(String(k));
    const qs = current.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    doNavigate(url);
  }, [keys, pathname, searchParams, doNavigate]);

  return {
    params,
    setParam,
    setParams,
    reset,
  } as UseQueryParamsReturn<T>;
}

/* -----------------------
   Small helper parsers
   ----------------------- */

export const parsers = {
  int: (opts?: { default?: number }) => ({
    parse: (v: string | null) => {
      if (v == null) return opts?.default;
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? opts?.default : n;
    },
    serialize: (v: number | undefined | null) =>
      v == null ? undefined : String(v),
  }),
  bool: (opts?: { default?: boolean }) => ({
    parse: (v: string | null) => {
      if (v == null) return opts?.default;
      if (v === "1" || v.toLowerCase() === "true") return true;
      if (v === "0" || v.toLowerCase() === "false") return false;
      return opts?.default;
    },
    serialize: (v: boolean | undefined | null) =>
      v == null ? undefined : v ? "1" : "0",
  }),
  csvArray: <T = string>(opts?: {
    default?: T[];
    itemParser?: (v: string) => T;
  }) => ({
    parse: (v: string | null) => {
      if (v == null || v === "") return opts?.default ?? [];
      return v
        .split(",")
        .map((s) => (opts?.itemParser ? opts.itemParser(s) : (s as any)));
    },
    serialize: (arr: T[] | undefined | null) =>
      !arr || arr.length === 0 ? undefined : (arr as any).join(","),
  }),
  stringDefault: (opts?: { default?: string }) => ({
    parse: (v: string | null) => (v == null ? opts?.default : v),
    serialize: (v: string | undefined | null) =>
      v == null || v === "" ? undefined : String(v),
  }),
};
