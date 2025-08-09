"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className=" min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-6 text-center leading-tight">
        Generate Stunning Landing Pages with AI
      </h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Rapidly create beautiful and responsive HTML/CSS landing pages just by describing them.
        Perfect for MVPs and quick prototypes.
      </p>
      {session ? (
        <Button size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
          <Link href="/chat">Go to Home</Link>
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
            <Link href="/auth/register">Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}