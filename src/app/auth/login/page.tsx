'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';
import Image from "next/image";
import { LoginInput, loginSchema } from "@/lib/validation";

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  TooManyAttempts: "Too many login attempts. Please wait 15 minutes and try again.",
  OAuthAccountNotLinked: "This email is already registered with a password. Log in with your email and password.",
  AccessDenied: "Access denied.",
  SessionRequired: "Please log in to continue.",
};

// Only allow redirects back into this site
function safeCallbackUrl(raw: string | null) {
  if (!raw) return "/chat";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith("/auth")) return "/chat";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/chat";
  }
}

function LoginForm() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (urlError) toast.error(AUTH_ERRORS[urlError] ?? "Login failed. Please try again.", { id: "auth-error" });
  }, [urlError]);

  const isLoading = isSubmitting || isGoogleLoading;

  const onSubmit = async ({ email, password }: LoginInput) => {
    try {
      const result = await signIn("credentials", { redirect: false, email, password });
      if (!result || result.error) {
        toast.error(AUTH_ERRORS[result?.error ?? ""] ?? "Login failed. Please try again.");
        return;
      }
      toast.success("Successfully logged in!");
      router.replace(safeCallbackUrl(searchParams.get("callbackUrl")));
      router.refresh();
    } catch {
      toast.error("Network error. Check your connection.");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: safeCallbackUrl(searchParams.get("callbackUrl")) });
    } catch {
      toast.error("Could not start Google login. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                maxLength={254}
                aria-invalid={!!errors.email}
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                maxLength={72}
                aria-invalid={!!errors.password}
                disabled={isLoading}
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button
              variant="default"
              type="submit"
              className="w-full"
              disabled={isLoading}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}>
              <Image
                src="/google.png"
                alt="google"
                width="24"
                height="24" />
              {isGoogleLoading ? "Redirecting..." : "Login with Google"}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center md:p-0 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
