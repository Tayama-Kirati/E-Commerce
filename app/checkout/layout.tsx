import { Suspense } from "react";

// Pages below read the query string with useSearchParams(), which needs a
// Suspense boundary so the rest of the page can still be prerendered.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
