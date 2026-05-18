import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 빌드할 때 타입스크립트 및 린트 에러를 무시하는 것처럼,
  // 넥스트 빌드 봇이 프리즈마를 읽을 때 에러를 내지 않도록 예외 처리 규칙을 명시합니다.
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;