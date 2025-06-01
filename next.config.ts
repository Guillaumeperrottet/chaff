// next.config.ts - Optimized for performance
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimizations
  images: {
    domains: ["res.cloudinary.com"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 1 day cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive image sizes
    imageSizes: [16, 32, 64, 96, 128, 256, 384], // Image sizes for next/image
  },

  // Server action size increase when needed
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // Reduced from 10mb to improve performance
    },
    // Enable optimizations
    optimizeCss: false, // Enable CSS optimization
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@headlessui/react",
      "framer-motion",
      "date-fns",
    ],
  },

  // Improved caching strategy
  async headers() {
    return [
      // API routes
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
      // Static assets with long cache
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Images with cache
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      // Service worker allowed for PWA
      {
        source: "/(.*)",
        headers: [{ key: "Service-Worker-Allowed", value: "/" }],
      },
    ];
  },

  // Generate optimized and compressed output
  swcMinify: true, // Use SWC minification instead of Terser for better performance

  // PWA configuration
  // Note: Should be added using next-pwa in your actual implementation

  // Debug only in development
  logging:
    process.env.NODE_ENV === "development"
      ? { fetches: { fullUrl: true } }
      : undefined,

  // Configure webpack for additional optimizations
  webpack: (config, { isServer }) => {
    // Only run these optimizations on client
    if (!isServer) {
      // Split chunks for better caching
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
          // Separate large dependencies into their own chunks
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
