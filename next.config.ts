import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow product photos and model thumbnails from Vercel Blob and Meshy
  // to be shown with the Next.js <Image> component.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "assets.meshy.ai" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
