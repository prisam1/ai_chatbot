import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useApi } from './useApi';
import { Message, Usage } from '@/types/message';
import { GenerationOptions } from '@/lib/validation';

interface ChatPromptPayload {
  prompt: string;
  options?: GenerationOptions;
}

interface HistoryResponse {
  messages: Message[];
  usage: Usage;
}

interface GenerateResponse {
  userMessage: Message;
  message: Message;
  usage: Usage;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const history = useApi<HistoryResponse>();
  const generate = useApi<GenerateResponse, ChatPromptPayload>();
  const enhance = useApi<{ prompt: string }, { prompt: string }>();
  const clear = useApi<{ ok: boolean }>();
  const remove = useApi<{ deleted: string[] }>();
  const share = useApi<{ shareId: string | null }>();
  const abortRef = useRef<AbortController | null>(null);
  const fetchHistory = history.fetchData;

  const handleError = useCallback((errorMsg: string, status: number) => {
    toast.error(errorMsg);
    if (status === 401) signOut({ callbackUrl: '/auth/login' });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory('/api/chat', { signal: controller.signal, showToast: false, onError: handleError }).then((res) => {
      if (!res) return;
      setMessages(res.messages);
      setUsage(res.usage);
    });
    return () => controller.abort();
  }, [fetchHistory, handleError]);

  // Abort any running generation when the page unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const generateLandingPage = async (prompt: string, options?: GenerationOptions) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: prompt, createdAt: new Date().toISOString() }]);

    const response = await generate.fetchData('/api/chat', {
      method: 'POST',
      body: { prompt, options },
      signal: controller.signal,
      showToast: false,
      onError: (errorMsg, status) => handleError(`Failed to generate page: ${errorMsg}`, status),
    });

    if (abortRef.current === controller) abortRef.current = null;

    setMessages((prev) => {
      const rest = prev.filter((m) => m.id !== tempId);
      return response ? [...rest, response.userMessage, response.message] : rest;
    });
    if (response) setUsage(response.usage);
    return response?.message ?? null;
  };

  const cancel = () => {
    abortRef.current?.abort();
    toast.info('Generation cancelled.');
  };

  const enhancePrompt = async (prompt: string) => {
    const res = await enhance.fetchData('/api/chat/enhance', {
      method: 'POST',
      body: { prompt },
      showToast: false,
      onError: handleError,
    });
    return res?.prompt ?? null;
  };

  const clearHistory = async () => {
    const res = await clear.fetchData('/api/chat', {
      method: 'DELETE',
      successMessage: 'Chat history cleared.',
      onError: (msg, status) => status === 401 && handleError(msg, status),
    });
    if (res) setMessages([]);
    return !!res;
  };

  const deleteVersion = async (id: string) => {
    const res = await remove.fetchData(`/api/chat/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      successMessage: 'Version deleted.',
      onError: (msg, status) => status === 401 && handleError(msg, status),
    });
    if (res) setMessages((prev) => prev.filter((m) => !res.deleted.includes(m.id)));
    return !!res;
  };

  const setShared = async (id: string, shared: boolean) => {
    const res = await share.fetchData(`/api/chat/${encodeURIComponent(id)}/share`, {
      method: shared ? 'POST' : 'DELETE',
      showToast: false,
      onError: handleError,
    });
    // undefined = failed, null = sharing turned off
    if (!res) return undefined;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, shareId: res.shareId } : m)));
    return res.shareId;
  };

  return {
    messages,
    usage,
    generateLandingPage,
    cancel,
    enhancePrompt,
    clearHistory,
    deleteVersion,
    setShared,
    loading: generate.loading,
    enhancing: enhance.loading,
    historyLoading: history.loading,
    clearing: clear.loading,
    sharing: share.loading,
  };
};
