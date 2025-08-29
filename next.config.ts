import type {NextConfig} from 'next';

const repo = 'Zeiterfassung-Prototype';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: repo ? `/${repo}` : undefined,
  assetPrefix: repo ? `/${repo}/` : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
