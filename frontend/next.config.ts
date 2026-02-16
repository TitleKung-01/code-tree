import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Use frontend as resolution root so dependencies (e.g. tailwindcss) resolve from frontend/node_modules
    // when the repo has a package.json at root (e.g. for supabase CLI) and multiple lockfiles.
    root: __dirname,
  },
};

export default nextConfig;
