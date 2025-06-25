import { useCallback } from "react";
import { apiFetch, fetchData } from "./api";

export default function useCrud() {
  const loadItems = useCallback(async <T>(url: string): Promise<T[]> => {
    const data = await fetchData(url);

    if (Array.isArray(data)) return data as T[];
    if (data && Array.isArray((data as any).results)) return (data as any).results as T[];
    return [];
  }, []);

  const createItem = async (
    url: string,
    item: any,
    opts: { isFormData?: boolean } = {},
  ) => {
    const { isFormData } = opts;
    const init: RequestInit = {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? (item as BodyInit) : JSON.stringify(item),
    };

    return apiFetch(url, init);
  };

  const updateItem = async (
    url: string,
    item: any,
    opts: { method?: "PUT" | "PATCH"; isFormData?: boolean } = {},
  ) => {
    const { method = "PUT", isFormData } = opts;
    const init: RequestInit = {
      method,
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? (item as BodyInit) : JSON.stringify(item),
    };

    return apiFetch(url, init);
  };

  const deleteItem = async (
    url: string,
    opts: { method?: "DELETE" | "POST"; payload?: any } = {},
  ) => {
    const { method = "DELETE", payload } = opts;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    };

    return apiFetch(url, init);
  };

  return { loadItems, createItem, updateItem, deleteItem };
}
