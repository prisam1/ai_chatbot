import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useApi } from './useApi';
import { Message } from '@/types/message';

interface ChatPromptPayload {
  prompt: string;
}

interface HistoryResponse {
  messages: Message[];
}

interface GenerateResponse {
  userMessage: Message;
  message: Message;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const history = useApi<HistoryResponse>();
  const generate = useApi<GenerateResponse, ChatPromptPayload>();
  const clear = useApi<{ ok: boolean }>();
  const abortRef = useRef<AbortController | null>(null);
  const fetchHistory = history.fetchData;

  const handleError = useCallback((errorMsg: string, status: number) => {
    if (status === 401) {
      toast.error(errorMsg);
      signOut({ callbackUrl: '/auth/login' });
      return;
    }
    toast.error(errorMsg);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory('/api/chat', { signal: controller.signal, showToast: false, onError: handleError }).then((res) => {
      if (res) setMessages(res.messages);
    });
    return () => controller.abort();
  }, [fetchHistory, handleError]);

  // Abort any running generation when the page unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const generateLandingPage = async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: prompt, createdAt: new Date().toISOString() }]);

    const response = await generate.fetchData('/api/chat', {
      method: 'POST',
      body: { prompt },
      signal: controller.signal,
      showToast: false,
      onError: (errorMsg, status) => handleError(`Failed to generate page: ${errorMsg}`, status),
    });

    if (abortRef.current === controller) abortRef.current = null;

    setMessages((prev) => {
      const rest = prev.filter((m) => m.id !== tempId);
      return response ? [...rest, response.userMessage, response.message] : rest;
    });
    return !!response;
  };

  const cancel = () => {
    abortRef.current?.abort();
    toast.info('Generation cancelled.');
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

  return {
    messages,
    generateLandingPage,
    cancel,
    clearHistory,
    loading: generate.loading,
    historyLoading: history.loading,
    clearing: clear.loading,
  };
};
