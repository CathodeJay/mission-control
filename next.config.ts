import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow better-sqlite3 as server-only (not bundled for client)
  serverExternalPackages: ["better-sqlite3"],
  // Port config via env
  env: {
    MISSION_CONTROL_PORT: process.env.MISSION_CONTROL_PORT || "3100",
  },
  // Allow Tailscale host for dev hot reload
  allowedDevOrigins: ["solar-clawd.tail3445ba.ts.net", "127.0.0.1", "localhost"],
  // Hide Next.js dev indicator
  devIndicators: false,
};

export default nextConfig;
