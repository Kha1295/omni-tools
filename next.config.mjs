const isStaticExport = process.env.STATIC_EXPORT === "true" || process.env.DEPLOY_TARGET === "gh-pages";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: "/omni-tools",
        assetPrefix: "/omni-tools",
      }
    : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
