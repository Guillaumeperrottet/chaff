// src/app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://plannikeeper.ch";

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "daily" as const,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      priority: 0.9,
      changeFrequency: "daily" as const,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
  ];

  return routes;
}
