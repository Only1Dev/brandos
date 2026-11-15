import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://brandos-jet.vercel.app";
  const routes = [
    "",
    "/dashboard",
    "/reviews",
    "/content",
    "/knowledge/guidelines",
    "/knowledge/facts",
    "/knowledge/claims",
    "/knowledge/terminology",
    "/knowledge/assets",
    "/analytics",
    "/audit",
    "/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
