import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Code2, Link2, MonitorSmartphone, Palette, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";

const FEATURES = [
  { icon: Wand2, title: "AI prompt enhancer", text: "Turn a rough idea into a detailed design brief in one click." },
  { icon: Palette, title: "Styles & colours", text: "Pick a style, an accent colour and exactly the sections you need." },
  { icon: MonitorSmartphone, title: "Device preview", text: "Check every page on desktop, tablet and mobile instantly." },
  { icon: Code2, title: "Live code editor", text: "Tweak the HTML and watch the preview update as you type." },
  { icon: Sparkles, title: "Iterate in chat", text: "Ask for changes and keep every version to compare." },
  { icon: Link2, title: "Share & download", text: "Download clean HTML or share a secure public link." },
];

export default async function HomePage() {
  // Redirect on the server, no loading flash
  const session = await getServerSession(authOptions);
  if (session) redirect("/chat");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white px-4 py-12">
      <div className="mb-6 flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
        <Sparkles className="h-4 w-4" /> PageForge AI
      </div>
      <h1 className="md:text-6xl text-3xl font-extrabold mb-6 text-center leading-tight tracking-tight max-w-4xl">
        Turn ideas into{" "}
        <span className="bg-gradient-to-r from-amber-200 via-pink-200 to-white bg-clip-text text-transparent">stunning landing pages</span>{" "}
        in seconds
      </h1>
      <p className="md:text-xl text-base mb-8 text-center max-w-2xl text-white/90">
        Describe it. We&apos;ll build it. Responsive HTML & CSS pages, ready to preview, edit, download and share.
      </p>
      <div className="flex gap-4 mb-14">
        <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
          <Link href="/auth/register">Start for free</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4 bg-transparent text-white border-white hover:bg-white/15 hover:text-white">
          <Link href="/auth/login">Login</Link>
        </Button>
      </div>
      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <Icon className="mb-3 h-6 w-6" />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-white/80">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
