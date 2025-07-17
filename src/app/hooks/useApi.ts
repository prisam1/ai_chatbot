import { useState, useCallback } from 'react';
import { toast } from 'sonner'; 

interface ApiHookOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean; // To control toast display
  successMessage?: string; // Option success message for toast
}

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetchData: (url: string, options?: ApiHookOptions) => Promise<T | null>;
}

export const useApi = <T = any>(): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (url: string, options?: ApiHookOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setData(null);

    const {
      method = 'GET',
      headers = { 'Content-Type': 'application/json' },
      body,
      onSuccess,
      onError,
      showToast = true,  
    } = options || {};

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        let errorData: any = null;

        try {
          errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (jsonError) { 
           console.error("Error parsing response JSON:", jsonError);
        }

        setError(errorMessage);
        if (showToast) {
          toast.error(errorMessage);
        }
        onError?.(errorMessage);
        return null;
      }

      const responseData: T = await response.json();
      setData(responseData);
      if (showToast) {
        toast.success(options?.successMessage || 'Operation successful!');
      }
      onSuccess?.(responseData);
      return responseData;

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};