import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/docs"],
        // Block internal dashboards and API routes from indexing
        disallow: [
          "/api/",
          "/owner/",
          "/agent/",
          "/ops/",
          "/onboarding",
          "/proposal/",
        ],
      },
    ],
    sitemap: "https://travelosapp.com/sitemap.xml",
  };
}
