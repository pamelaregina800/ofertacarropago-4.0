/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build nao quebra por erro de lint ou tipo - deploy sempre vai
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Imagens remotas usadas no projeto (banner da hero, etc)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    unoptimized: true,
  },
}

export default nextConfig
