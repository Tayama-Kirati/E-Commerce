import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading       = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user            = session?.user;

  const requireAuth = (callback?: () => void) => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    callback?.();
    return true;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ callbackUrl: "/" });
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin:  user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    isSeller: user?.role === "SELLER",
    requireAuth,
    logout,
    update,
  };
}