import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type Body = object | FormData | URLSearchParams | string | undefined;

interface ApiHookOptions<TData, TBody extends Body = undefined> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: TBody;
  signal?: AbortSignal;
  onSuccess?: (data: TData) => void;
  onError?: (error: string, status: number) => void;
  showToast?: boolean;
  successMessage?: string;
}

interface ApiResponse<TData, TBody extends Body = undefined> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  fetchData: (url: string, options?: ApiHookOptions<TData, TBody>) => Promise<TData | null>;
}

// Pulls a readable message out of any error body shape
function extractMessage(raw: string, status: number) {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string' && parsed) return parsed;
    if (typeof parsed === 'object' && parsed !== null) {
      for (const key of ['error', 'message', 'msg'] as const) {
        const value = (parsed as Record<string, unknown>)[key];
        if (typeof value === 'string' && value) return value;
      }
    }
  } catch {
    if (raw && raw.length < 300 && !raw.trimStart().startsWith('<')) return raw;
  }
  return status === 0 ? 'Network error. Check your connection.' : `Request failed (${status})`;
}

export const useApi = <TData = unknown, TBody extends Body = undefined>(): ApiResponse<TData, TBody> => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (url: string, options?: ApiHookOptions<TData, TBody>): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    const {
      method = 'GET',
      headers: initialHeaders,
      body,
      signal,
      onSuccess,
      onError,
      showToast = true,
      successMessage,
    } = options || {};

    const fail = (message: string, status: number) => {
      setError(message);
      if (showToast) toast.error(message);
      onError?.(message, status);
      return null;
    };

    try {
      const headers = new Headers(initialHeaders);
      const fetchOptions: RequestInit = { method, headers, signal, credentials: 'same-origin' };

      if (body instanceof FormData) {
        fetchOptions.body = body;
      } else if (body instanceof URLSearchParams) {
        fetchOptions.body = body;
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
        headers.set('Content-Type', 'text/plain');
      } else if (typeof body === 'object' && body !== null) {
        fetchOptions.body = JSON.stringify(body);
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, fetchOptions);
      const raw = await response.text();

      if (!response.ok) return fail(extractMessage(raw, response.status), response.status);

      let responseData: TData | null = null;
      if (raw) {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        try {
          responseData = (isJson ? JSON.parse(raw) : raw) as TData;
        } catch {
          return fail('The server sent an invalid response.', response.status);
        }
      }

      setData(responseData);
      if (showToast) toast.success(successMessage || 'Operation successful!');
      if (responseData !== null) onSuccess?.(responseData);
      return responseData;
    } catch (err: unknown) {
      // Cancelled on purpose, not an error
      if (signal?.aborted) return null;
      return fail(err instanceof TypeError ? 'Network error. Check your connection.' : 'An unexpected error occurred.', 0);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};
