"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider }   from "@/app/apps/providers/ThemeProvider";
import type { ReactNode }  from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/apps/api/auth" refetchInterval={5 * 60} refetchOnWindowFocus>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}