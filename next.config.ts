import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "@anthropic-ai/sdk", "docx", "exceljs", "mammoth", "pdf-parse"],
};

export default nextConfig;
