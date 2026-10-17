import type { MetadataRoute } from "next";
import { siteUrl } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or duplicate areas (/apps/* is the internal path behind the clean URLs)
      disallow: ["/api/", "/apps/", "/admin", "/seller", "/account", "/checkout", "/cart"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
