import type { NextConfig } from "next";

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`CRITICAL ERROR: Required environment variable ${envVar} is missing.`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
