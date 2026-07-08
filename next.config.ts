import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // CloudFront経由だとServer Actionsのオリジン検証がうまく働かず、
  // Originヘッダー付きPOST（実ブラウザは常にこれを送る）が500になる問題への対処
  experimental: {
    serverActions: {
      allowedOrigins: ["himuka-shift.lolipop-now.app"],
    },
  },
};

export default nextConfig;
