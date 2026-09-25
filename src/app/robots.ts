import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://professionhunter.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/about', '/contact', '/privacy', '/terms', '/login', '/signup', '/profession/'],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/dashboard-worker/',
          '/dashboard-store/',
          '/api/',
          '/chat/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
