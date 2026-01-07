import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // async headers() {
  //   return [
  //     {
  //       // ALL routes
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: `
  //             default-src 'self';
  //             script-src 'self' 'unsafe-inline' 'unsafe-eval' 
  //               https://mapwidget3.seatics.com 
  //               https://d1s8091zjpj5vh.cloudfront.net;
  //             style-src 'self' 'unsafe-inline' 
  //               https://mapwidget3.seatics.com 
  //               https://d1s8091zjpj5vh.cloudfront.net 
  //               https://maxcdn.bootstrapcdn.com;
  //             img-src 'self' data: blob: 
  //               https://mapwidget3.seatics.com 
  //               https://d1s8091zjpj5vh.cloudfront.net;
  //             connect-src 'self' 
  //               https://mapwidget3.seatics.com 
  //               https://d1s8091zjpj5vh.cloudfront.net;
  //             font-src 'self' 
  //               https://d1s8091zjpj5vh.cloudfront.net;
  //           `.replace(/\s{2,}/g, ' ').replace(/[\r\n]/g, ' ')
  //         }
  //       ]
  //     }
  //   ];
  // },
   async rewrites() {
    return [
      {
        source: '/seatics/:path*',
        destination: 'https://mapwidget3.seatics.com/:path*',
      },
    ];
  },
};

export default nextConfig;
