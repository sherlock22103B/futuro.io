/**
 * Il sito è interamente statico (nessun server): viene esportato in HTML/JS/CSS
 * e pubblicato su GitHub Pages. NEXT_PUBLIC_BASE_PATH è il sottopercorso del sito
 * (es. "/futuro-io" per https://utente.github.io/futuro-io); vuoto in locale.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
