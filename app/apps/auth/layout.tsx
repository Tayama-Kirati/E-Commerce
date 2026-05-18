import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Sign In | NexMart",
  description: "Sign in to your NexMart account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
