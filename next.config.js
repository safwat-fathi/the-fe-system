const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize performance
  experimental: {
    optimizePackageImports: ["@heroui/react", "@heroicons/react"],
  },

  // Enable strict mode for better performance warnings
  reactStrictMode: true,

  // Optimize images if needed
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Webpack configuration for better chunk handling
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     // Optimize chunk splitting for client-side
  //     config.optimization = {
  //       ...config.optimization,
  //       splitChunks: {
  //         chunks: 'all',
  //         cacheGroups: {
  //           default: false,
  //           vendors: false,
  //           // Separate vendor chunks for better caching
  //           heroui: {
  //             name: 'heroui',
  //             test: /[\\/]node_modules[\\/]@heroui[\\/]/,
  //             priority: 30,
  //             reuseExistingChunk: true,
  //           },
  //           vendor: {
  //             name: 'vendor',
  //             test: /[\\/]node_modules[\\/]/,
  //             priority: 20,
  //             reuseExistingChunk: true,
  //           },
  //         },
  //       },
  //     };
  //   }
  //   return config;
  // },
};

module.exports = withNextIntl(nextConfig);
