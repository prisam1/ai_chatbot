import { useApi } from './useApi';
import { toast } from 'sonner';

interface RegisterPayload {
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  userId?: string;
}

export const useRegister = () => { 
  const { loading, error, fetchData } = useApi<RegisterResponse, RegisterPayload>();

  const registerUser = async (payload: RegisterPayload) => {
    const response = await fetchData("/api/auth/register", {
      method: "POST",
      body: payload,  
      successMessage: "Account created successfully! Please log in.",
      onError: (errorMsg) => {
        if (errorMsg.includes("already exists") || errorMsg.includes("409")) {
          toast.error("Account already exists. Please login instead.");
        } else {
          toast.error("Internal Server Error");
        }
      }
    });
    return response;
  };

  return {
    registerUser,
    loading,
    error,
  };
};