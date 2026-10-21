import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextAuthSessionProvider from "../components/providers/next-auth-provider";
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "AI Chatbot for Landing Pages",
  description: "Generate HTML/CSS landing pages with AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
