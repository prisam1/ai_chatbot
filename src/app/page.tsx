import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  // Redirect on the server, no loading flash
  const session = await getServerSession(authOptions);
  if (session) redirect("/chat");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
      <h1 className="md:text-5xl text-xl font-extrabold mb-6 text-center leading-tight">
        Generate Stunning Landing Pages with AI
      </h1>
      <p className="md:text-xl text-sm mb-8 text-center max-w-2xl">
        Rapidly create beautiful and responsive HTML/CSS landing pages just by describing them.
        Perfect for MVPs and quick prototypes.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
          <Link href="/auth/register">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
