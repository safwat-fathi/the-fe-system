/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize performance
  experimental: {
    optimizePackageImports: ['@heroui/react', '@heroicons/react'],
  },
  
  // Enable strict mode for better performance warnings
  reactStrictMode: true,
  
  // Optimize images if needed
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;
