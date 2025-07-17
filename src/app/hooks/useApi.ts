import { useState, useCallback } from 'react';
import { toast } from 'sonner';

 
interface ApiHookOptions<TData, TBody extends object | FormData | URLSearchParams | string | undefined = undefined> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: TBody;  
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  successMessage?: string;
}

 
interface ApiResponse<TData, TBody extends object | FormData | URLSearchParams | string | undefined = undefined> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  fetchData: (url: string, options?: ApiHookOptions<TData, TBody>) => Promise<TData | null>;
}

 
export const useApi = <TData = unknown, TBody extends object | FormData | URLSearchParams | string | undefined = undefined>(): ApiResponse<TData, TBody> => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (url: string, options?: ApiHookOptions<TData, TBody>): Promise<TData | null> => {
    setLoading(true);
    setError(null);
    setData(null);

    const {
      method = 'GET',
      headers: initialHeaders,
      body,  
      onSuccess,
      onError,
      showToast = true,
      successMessage,
    } = options || {};

    try {
      const headers = new Headers(initialHeaders || { 'Content-Type': 'application/json' });

      const fetchOptions: RequestInit = {
        method,
        headers: headers,
      };

      if (body !== undefined) {
        if (body instanceof FormData) {
          fetchOptions.body = body;
          headers.delete('Content-Type');
        } else if (body instanceof URLSearchParams) {
          fetchOptions.body = body;
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
        } else if (typeof body === 'object' && body !== null) {
           
          fetchOptions.body = JSON.stringify(body);
          headers.set('Content-Type', 'application/json');
        } else if (typeof body === 'string') {
          fetchOptions.body = body;
          headers.set('Content-Type', 'text/plain'); 
        } else {
            console.error("Unsupported body type provided to useApi:", typeof body, body);
            throw new Error("Unsupported request body type.");
        }
      }

      fetchOptions.headers = headers;

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        let errorData: unknown = null;

        try {
          errorData = await response.json();
          if (typeof errorData === 'object' && errorData !== null) {
            if ('message' in errorData && typeof errorData.message === 'string') {
              errorMessage = errorData.message;
            } else if ('error' in errorData && typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if ('msg' in errorData && typeof errorData.msg === 'string') {
              errorMessage = errorData.msg;
            }
          } else if (typeof errorData === 'string' && errorData.length > 0) {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          try {
            const textError = await response.text();
            if (textError.length > 0) {
              errorMessage = textError;
            }
          } catch (textParseError) {
            console.error("Error reading response as text:", textParseError);
          }
          console.error("Error parsing response JSON, falling back to text or default:", jsonError);
        }

        setError(errorMessage);
        if (showToast) {
          toast.error(errorMessage);
        }
        onError?.(errorMessage);
        return null;
      }

      const contentType = response.headers.get('content-type');
      let responseData: TData | null = null;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType && contentType.startsWith('text/')) {
          responseData = await response.text() as TData;
      } else {
          try {
              const textBody = await response.text();
              if (textBody) {
                  console.warn("Response was not JSON or plain text, but had content:", textBody);
              }
          } catch { /* ignore */ }
      }

      setData(responseData);
      if (showToast) {
        toast.success(successMessage || 'Operation successful!');
      }

      if (responseData !== null) {
        onSuccess?.(responseData);
      }
      return responseData;

    } catch (err: unknown) {
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