"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface NextAuthSessionProviderProps {
  children: React.ReactNode;
}

export default function NextAuthSessionProvider({
  children,
}: NextAuthSessionProviderProps) {
  // Recheck the session every 5 minutes and when the tab regains focus
  return <SessionProvider refetchInterval={5 * 60}>{children}</SessionProvider>;
}
