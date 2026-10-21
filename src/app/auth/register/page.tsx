'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRegister } from "@/app/hooks/useRegister";
import { RegisterFormInput, registerFormSchema } from "@/lib/validation";

export default function Signup() {
  const router = useRouter();
  const { registerUser } = useRegister();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ email, password }: RegisterFormInput) => {
    const response = await registerUser({ email, password });
    if (!response) return;

    // Sign straight in; fall back to the login page if that fails
    const result = await signIn("credentials", { redirect: false, email, password }).catch(() => undefined);
    if (result?.ok && !result.error) {
      toast.success("Account created. Welcome!");
      router.replace("/chat");
      router.refresh();
    } else {
      toast.success("Account created successfully! Please log in.");
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center md:p-0 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create an account to start generating HTML and CSS.
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
                  disabled={isSubmitting}
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
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={!!errors.password}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">At least 8 characters with uppercase, lowercase and a number.</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isSubmitting}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing up..." : "Sign Up"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
