import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/utilities/api';
import { ERROR_MESSAGES } from '@/constants';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {},
      apiOptions: UseApiOptions<T> = {}
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // إذا فشل في تحليل JSON، استخدم رسالة افتراضية
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        setState({ data, loading: false, error: null });
        apiOptions.onSuccess?.(data);
        
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR;
        
        setState({ data: null, loading: false, error: errorMessage });
        apiOptions.onError?.(errorMessage);
        
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook خاص للعمليات CRUD
export function useCrud<T = any>(endpoint: string) {
  const { data, loading, error, execute, reset } = useApi<T[]>();

  const create = useCallback(
    async (item: Partial<T>) => {
      return execute(endpoint, {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },
    [execute, endpoint]
  );

  const update = useCallback(
    async (id: number, item: Partial<T>) => {
      return execute(`${endpoint}${id}/`, {
        method: 'PUT',
        body: JSON.stringify(item),
      });
    },
    [execute, endpoint]
  );

  const remove = useCallback(
    async (id: number) => {
      return execute(`${endpoint}${id}/`, {
        method: 'DELETE',
      });
    },
    [execute, endpoint]
  );

  const fetchAll = useCallback(
    async (params?: Record<string, string>) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      return execute(`${endpoint}${queryString}`);
    },
    [execute, endpoint]
  );

  const fetchById = useCallback(
    async (id: number) => {
      return execute(`${endpoint}${id}/`);
    },
    [execute, endpoint]
  );

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    fetchAll,
    fetchById,
    reset,
  };
}
