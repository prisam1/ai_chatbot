import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "../components/providers/next-auth-provider";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chatbot for Landing Pages",
  description: "Generate HTML/CSS landing pages with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          {children}
          <Toaster position="top-center" richColors />
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
