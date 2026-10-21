import { useApi } from './useApi';
import { toast } from 'sonner';
import { RegisterInput } from '@/lib/validation';

interface RegisterResponse {
  message: string;
  userId?: string;
}

export const useRegister = () => {
  const { loading, error, fetchData } = useApi<RegisterResponse, RegisterInput>();

  const registerUser = async (payload: RegisterInput) => {
    const response = await fetchData("/api/auth/register", {
      method: "POST",
      body: payload,
      showToast: false,
      onError: (errorMsg) => toast.error(errorMsg),
    });
    return response;
  };

  return {
    registerUser,
    loading,
    error,
  };
};
