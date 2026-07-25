/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle so the runtime image ships only what
  // it needs instead of the whole node_modules tree.
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Marketing pages are served in 4 languages via locale-prefixed routes
  // (/, /en, /ru, /ko). 'uz' stays unprefixed so existing customer QR URLs
  // (/{slug}/{table}) keep working unchanged.
  i18n: {
    locales: ['uz', 'en', 'ru', 'ko'],
    defaultLocale: 'uz',
  },
};

module.exports = nextConfig;
