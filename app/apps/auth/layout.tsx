import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Sign In | PeaNut",
 description: "Sign in to your PeaNut account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen">
 {children}
 </div>
 );
}
