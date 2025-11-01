import { useCallback, useMemo, useReducer } from "react";
import {
  normalizeRowIdentifier,
  type InvoiceItemRow,
} from "@/utilities/invoiceForm";

type State = {
  items: InvoiceItemRow[];
  original: InvoiceItemRow[];
  deletedIds: number[];
};

type Updater<T> = T | ((prev: T) => T);

type Action =
  | { type: "SET_ALL"; payload: InvoiceItemRow[] }
  | { type: "RESET_FROM_SERVER"; payload: InvoiceItemRow[] }
  | { type: "SET_ORIGINAL"; payload: InvoiceItemRow[] }
  | { type: "MARK_DELETED"; payload: number }
  | { type: "CLEAR_DELETED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ALL":
      return { ...state, items: action.payload };
    case "RESET_FROM_SERVER":
      return { items: action.payload, original: action.payload, deletedIds: [] };
    case "SET_ORIGINAL":
      return { ...state, original: action.payload };
    case "MARK_DELETED":
      return state.deletedIds.includes(action.payload)
        ? state
        : { ...state, deletedIds: [...state.deletedIds, action.payload] };
    case "CLEAR_DELETED":
      return { ...state, deletedIds: [] };
    default:
      return state;
  }
}

export default function useInvoiceItemsReducer(
  initial: InvoiceItemRow[],
) {
  const [state, dispatch] = useReducer(reducer, {
    items: initial,
    original: initial,
    deletedIds: [],
  });

  const setInvoiceItems = useCallback(
    (next: Updater<InvoiceItemRow[]>) => {
      if (typeof next === "function") {
        dispatch({ type: "SET_ALL", payload: (next as any)(state.items) });
      } else {
        dispatch({ type: "SET_ALL", payload: next });
      }
    },
    [state.items],
  );

  const setOriginalInvoiceItems = useCallback((next: InvoiceItemRow[]) => {
    dispatch({ type: "SET_ORIGINAL", payload: next });
  }, []);

  const markDeleted = useCallback((id: number) => {
    dispatch({ type: "MARK_DELETED", payload: id });
  }, []);

  const clearDeleted = useCallback(() => {
    dispatch({ type: "CLEAR_DELETED" });
  }, []);

  const resetFromServer = useCallback((rows: InvoiceItemRow[]) => {
    dispatch({ type: "RESET_FROM_SERVER", payload: rows });
  }, []);

  const originalInvoiceItemMap = useMemo(() => {
    const map = new Map<string, InvoiceItemRow>();
    for (const item of state.original) {
      const key = normalizeRowIdentifier(item.id);
      if (key) map.set(key, item);
    }
    return map;
  }, [state.original]);

  return {
    invoiceItems: state.items,
    setInvoiceItems,
    originalInvoiceItems: state.original,
    setOriginalInvoiceItems,
    deletedItemIds: state.deletedIds,
    markDeleted,
    clearDeleted,
    resetFromServer,
    originalInvoiceItemMap,
  } as const;
}

