import { useApi } from './useApi'; 
import { toast } from 'sonner';

interface ChatPromptPayload {
  prompt: string;
}

interface ChatResponse {
  html: string; 
}

export const useChat = () => {
  const { loading, error, fetchData } = useApi<ChatResponse>();

  const generateLandingPage = async (payload: ChatPromptPayload) => {
    const response = await fetchData('/api/chat', {  
      method: 'POST',
      body: payload,
      showToast: false,  
      onError: (errorMsg) => {
        toast.error(`Failed to generate response: ${errorMsg}`);
      }
    });
    return response;
  };

  return {
    generateLandingPage,
    loading,  
    error,    
  };
};