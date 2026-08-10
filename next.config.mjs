/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Static export (Commented out to support dynamic API routes like /api/send-email)
  // output: 'export',

  // Optional: Agar image optimization use nahi karni
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: '**.imgbb.com',
      },
    ],
  },

  // Agar URL ke end me slash chahiye (shared hosting ke liye helpful)
  trailingSlash: true,
};

export default nextConfig;