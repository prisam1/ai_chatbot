// "use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextAuthSessionProvider from "../components/providers/next-auth-provider";
import { Toaster } from 'sonner';
//import { useEffect } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// function AppHeightSync() {
//   useEffect(() => {
//     const setAppHeight = () => {
//       document.documentElement.style.setProperty(
//         '--app-height',
//         `${window.innerHeight}px`
//       );
//     };

//     setAppHeight(); // Set on initial load
//     window.addEventListener('resize', setAppHeight); // Update on resize (e.g., orientation change)

//     return () => window.removeEventListener('resize', setAppHeight);
//   }, []);

//   return null;
// }

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
      {/* <AppHeightSync /> */}
      <body className={inter.className}>
        <NextAuthSessionProvider>
          {children}
          <Toaster position="top-center" richColors />
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
