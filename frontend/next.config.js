/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
