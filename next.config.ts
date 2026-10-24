import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
