import type { NextConfig } from "next";

/**
 * GitHub Pages отдаёт сайт по адресу https://<логин>.github.io/<репозиторий>/,
 * поэтому при сборке в CI передаём NEXT_PUBLIC_BASE_PATH=/<репозиторий>.
 * Локально и для репозитория <логин>.github.io basePath пустой.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  transpilePackages: ["@pravovukha/shared"],
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default config;
