import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Host of the Supabase project (public Storage URLs). Falls back to the known project.
function supabaseHost(): string {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    }
  } catch {
    // fall through
  }
  return "iswrajohklrrptfvzbfi.supabase.co";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
