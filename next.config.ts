import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "@anthropic-ai/sdk", "docx", "exceljs"],
};

export default nextConfig;
