/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@marketplace/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;
