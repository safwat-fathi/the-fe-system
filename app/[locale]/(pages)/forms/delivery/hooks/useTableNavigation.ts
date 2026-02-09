import { useRef, useCallback, useMemo, type KeyboardEvent } from "react";

type InputRef = HTMLInputElement | HTMLElement | null;

interface TableConfig {
  name: string;
  rows: unknown[];
  lastCol: number;
  addRow: () => void;
  onLastRow?: () => void;
}

interface UseTableNavigationParams {
  tables: TableConfig[];
}

interface KeyDownOptions {
  isLastCol?: boolean;
}

const focusElement = (el: InputRef | undefined): boolean => {
  if (!el) return false;

  if (el.getAttribute?.("role") === "combobox") {
    if (!el.hasAttribute("tabindex") || el.getAttribute("tabindex") === "-1") {
      el.setAttribute("tabindex", "0");
    }
  }

  const input = (el as HTMLElement).querySelector?.(
    "input",
  ) as HTMLInputElement;

  if (input) {
    input.focus();
    input.select?.();

    return true;
  }

  (el as HTMLElement).focus?.();

  return document.activeElement === el;
};

export function useTableNavigation({ tables }: UseTableNavigationParams) {
  const refs = useRef<Map<string, InputRef>>(new Map());

  const tableMap = useMemo(() => {
    const map = new Map<string, TableConfig>();

    tables.forEach((t) => map.set(t.name, t));

    return map;
  }, [tables]);

  const getKey = (table: string, row: number, col: number) =>
    `${table}-${row}-${col}`;

  const getRef = useCallback(
    (table: string, row: number, col: number) =>
      refs.current.get(getKey(table, row, col)),
    [],
  );

  const setRef = useCallback(
    (table: string, row: number, col: number) => (el: InputRef) => {
      const key = getKey(table, row, col);

      if (el) refs.current.set(key, el);
      else refs.current.delete(key);
    },
    [],
  );

  const focusCell = useCallback(
    (table: string, row: number, col: number): boolean => {
      const el = getRef(table, row, col);

      return focusElement(el);
    },
    [getRef],
  );

  const focusNextCol = useCallback(
    (table: string, row: number, col: number): boolean => {
      return focusCell(table, row, col + 1);
    },
    [focusCell],
  );

  const focusPrevCol = useCallback(
    (table: string, row: number, col: number): boolean => {
      if (col <= 0) return false;

      return focusCell(table, row, col - 1);
    },
    [focusCell],
  );

  const focusNextRow = useCallback(
    (table: string, row: number, col: number): boolean => {
      const config = tableMap.get(table);

      if (!config) return false;

      const nextRow = row + 1;

      if (nextRow >= config.rows.length) {
        config.addRow();
        setTimeout(() => focusCell(table, nextRow, 0), 50);

        return true;
      }

      return focusCell(table, nextRow, col);
    },
    [tableMap, focusCell],
  );

  const focusPrevRow = useCallback(
    (table: string, row: number, col: number): boolean => {
      if (row <= 0) return false;

      return focusCell(table, row - 1, col);
    },
    [focusCell],
  );

  const handleKeyDown = useCallback(
    (
      table: string,
      event: KeyboardEvent,
      row: number,
      col: number,
      options?: KeyDownOptions,
    ) => {
      const config = tableMap.get(table);

      if (!config) return;

      const target = event.target as HTMLElement;
      const isInListbox = target?.closest('[role="listbox"]');

      if (isInListbox) return;

      const selectButton = target?.closest('[role="combobox"]');
      const isExpanded = selectButton?.getAttribute("aria-expanded") === "true";

      const key = event.key;
      const isLastCol = options?.isLastCol ?? col >= config.lastCol;
      const isLastRow = row >= config.rows.length - 1;

      if (key === "ArrowDown" && !isExpanded) {
        event.preventDefault();
        focusNextRow(table, row, col);

        return;
      }

      if (key === "ArrowUp" && !isExpanded) {
        event.preventDefault();
        focusPrevRow(table, row, col);

        return;
      }

      if (key === "ArrowRight") {
        event.preventDefault();
        focusPrevCol(table, row, col);

        return;
      }

      if (key === "ArrowLeft") {
        event.preventDefault();
        focusNextCol(table, row, col);

        return;
      }

      if (key === "Enter" || (key === "Tab" && !event.shiftKey)) {
        if (!isLastCol) {
          event.preventDefault();
          focusNextCol(table, row, col);

          return;
        }

        if (isLastRow && isLastCol) {
          event.preventDefault();
          if (config.onLastRow) {
            config.onLastRow();
          } else {
            config.addRow();
            setTimeout(() => focusCell(table, row + 1, 0), 50);
          }

          return;
        }

        if (isLastCol && !isLastRow) {
          event.preventDefault();
          focusCell(table, row + 1, 0);

          return;
        }
      }
    },
    [
      tableMap,
      focusCell,
      focusNextCol,
      focusPrevCol,
      focusNextRow,
      focusPrevRow,
    ],
  );

  const createTableHelpers = useCallback(
    (tableName: string) => ({
      setInputRef: (row: number, col: number) => setRef(tableName, row, col),
      handleKeyDown: (
        event: KeyboardEvent,
        row: number,
        col: number,
        options?: KeyDownOptions,
      ) => handleKeyDown(tableName, event, row, col, options),
      focusCell: (row: number, col: number) => focusCell(tableName, row, col),
      focusNextField: (row: number, col: number) =>
        focusNextCol(tableName, row, col),
    }),
    [setRef, handleKeyDown, focusCell, focusNextCol],
  );

  return {
    setRef,
    getRef,
    handleKeyDown,
    focusCell,
    focusNextCol,
    focusPrevCol,
    focusNextRow,
    focusPrevRow,
    createTableHelpers,
  };
}
