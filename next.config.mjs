/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/pos', destination: '/', permanent: false },
      { source: '/food-order', destination: '/', permanent: false },
      { source: '/order', destination: '/', permanent: false },
      { source: '/dashboard', destination: '/admin', permanent: false },
      { source: '/analytics', destination: '/admin', permanent: false },
      { source: '/feedback', destination: '/', permanent: false },
      { source: '/message', destination: '/', permanent: false },
      { source: '/messages', destination: '/', permanent: false },
      { source: '/history', destination: '/', permanent: false },
      { source: '/settings', destination: '/', permanent: false },
      { source: '/customization', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;

