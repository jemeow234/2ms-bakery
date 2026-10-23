const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product photos uploaded from the admin panel are served from Supabase
    // Storage; bundled ones come from /public and need no entry here.
    remotePatterns: supabaseUrl
      ? [new URL('/storage/v1/object/public/**', supabaseUrl)]
      : [],
  },
}

export default nextConfig
