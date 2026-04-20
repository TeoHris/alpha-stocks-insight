import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/articles'

const BASE_URL = 'https://alphastocksinsight.com' // ← change to your domain

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/stock-insights`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/watchlist`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ai-agent-instructions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.dateISO),
    changeFrequency: 'weekly' as const,
    priority: article.featured ? 0.9 : 0.8,
  }))

  return [...staticPages, ...articlePages]
}
