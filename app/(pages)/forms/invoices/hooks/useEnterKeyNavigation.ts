import { useRef, useCallback, type KeyboardEvent } from "react";

type NullableInput = HTMLInputElement | null;

interface UseEnterKeyNavigationOptions<Row> {
  rows: Row[];
  rowHasValue: (row: Row | undefined) => boolean;
  onAddRow: () => void;
}

interface UseEnterKeyNavigationResult {
  setInputRef: (rowIndex: number, colIndex: number) => (node: NullableInput) => void;
  handleKeyDown: (
    event: KeyboardEvent,
    rowIndex: number,
    colIndex: number,
    options?: { isLastCol?: boolean },
  ) => void;
  focusFirstInRow: (rowIndex: number) => boolean;
}

export default function useEnterKeyNavigation<Row>(
  options: UseEnterKeyNavigationOptions<Row>,
): UseEnterKeyNavigationResult {
  const { rows, rowHasValue, onAddRow } = options;
  const inputRefs = useRef<NullableInput[][]>([]);

  const focusNode = (node: NullableInput) => {
    try {
      node?.focus?.();
    } catch {
      // ignore focus failures
    }
  };

  const focusFirstInRow = useCallback((rowIndex: number) => {
    const rowRefs = inputRefs.current[rowIndex] || [];

    for (let i = 0; i < rowRefs.length; i += 1) {
      const el = rowRefs[i];
      if (el) {
        focusNode(el);
        return true;
      }
    }

    return false;
  }, []);

  const focusFirstInRowAsync = useCallback((rowIndex: number, tries = 6) => {
    const tick = (remaining: number) => {
      if (focusFirstInRow(rowIndex)) return;
      if (remaining <= 0) return;

      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => tick(remaining - 1));
      } else {
        setTimeout(() => tick(remaining - 1), 16);
      }
    };

    tick(tries);
  }, [focusFirstInRow]);

  const focusNextRowFirstCell = useCallback((rowIndex: number) => {
    focusFirstInRow(rowIndex);
    focusFirstInRowAsync(rowIndex, 8);
    setTimeout(() => focusFirstInRow(rowIndex), 0);
    setTimeout(() => focusFirstInRow(rowIndex), 40);
    setTimeout(() => focusFirstInRow(rowIndex), 100);
  }, [focusFirstInRow, focusFirstInRowAsync]);

  const handleKeyDown = useCallback(
    (
      event: KeyboardEvent,
      rowIndex: number,
      colIndex: number,
      { isLastCol }: { isLastCol?: boolean } = {},
    ) => {
      const key = event.key;
      if (key !== "Tab" && key !== "Enter") return;
      if (key === "Tab" && (event as any).shiftKey) return;

      const rowRefs = inputRefs.current[rowIndex] || [];
      const lastColIndex = rowRefs.length - 1;
      const atLastCol =
        typeof isLastCol === "boolean" ? isLastCol : colIndex >= lastColIndex;
      const isLastRow = rowIndex === rows.length - 1;
      const hasValue = rowHasValue(rows[rowIndex]);

      if (key === "Enter") {
        event.preventDefault();

        if (!atLastCol) {
          const nextInRow = rowRefs[colIndex + 1];
          if (nextInRow) focusNode(nextInRow);
          return;
        }

        if (!hasValue) {
          return;
        }

        if (!isLastRow) {
          focusFirstInRow(rowIndex + 1);
          return;
        }

        onAddRow();
        focusNextRowFirstCell(rowIndex + 1);
        return;
      }

      // Tab key
      if (!atLastCol) {
        return;
      }

      if (!hasValue) {
        return;
      }

      event.preventDefault();
      if (!isLastRow) {
        focusFirstInRow(rowIndex + 1);
        return;
      }

      onAddRow();
      focusNextRowFirstCell(rowIndex + 1);
    },
    [focusFirstInRow, focusNextRowFirstCell, onAddRow, rowHasValue, rows],
  );

  const setInputRef = useCallback(
    (rowIndex: number, colIndex: number) => (node: NullableInput) => {
      if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = [];
      inputRefs.current[rowIndex][colIndex] = node;
    },
    [],
  );

  return {
    setInputRef,
    handleKeyDown,
    focusFirstInRow,
  };
}
