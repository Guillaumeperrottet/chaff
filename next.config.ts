// next.config.ts - Configuration pour Chaff.ch
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimizations
  images: {
    domains: ["res.cloudinary.com"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@headlessui/react",
      "framer-motion",
      "date-fns",
    ],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        has: [{ type: "header", key: "referer", value: "(?!.*stripe.com).*" }],
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [{ key: "Service-Worker-Allowed", value: "/" }],
      },
    ];
  },

  swcMinify: true,

  logging:
    process.env.NODE_ENV === "development"
      ? { fetches: { fullUrl: true } }
      : undefined,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          reactVendors: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendors",
            chunks: "all",
            priority: 10,
          },
          uiComponents: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: "ui-vendors",
            chunks: "all",
            priority: 9,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
