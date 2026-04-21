// ============================================================
// ARTICLE UTILITIES — Alpha Stocks Insight
// ============================================================
// This file provides all data-fetching helpers for articles.
// Currently reads from local JSON. Replace these functions with
// API calls when you connect a real backend / headless CMS.
// ============================================================

import articlesData from '@/data/articles.json'
import type { Article, ArticlesByDate } from './types'

const articles = articlesData as Article[]

/** Return all articles sorted newest first */
export function getAllArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  )
}

/** Find a single article by its URL slug */
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

/** Return articles that reference a specific stock ticker */
export function getArticlesByTicker(symbol: string): Article[] {
  const s = symbol.toUpperCase()
  return getAllArticles().filter((a) =>
    a.tickers.some((t) => t.symbol.toUpperCase() === s)
  )
}

/** Return featured articles */
export function getFeaturedArticles(): Article[] {
  return getAllArticles().filter((a) => a.featured)
}

/** Return articles grouped by their display date */
export function getArticlesByDate(): ArticlesByDate {
  const byDate: ArticlesByDate = {}
  getAllArticles().forEach((article) => {
    if (!byDate[article.date]) byDate[article.date] = []
    byDate[article.date].push(article)
  })
  return byDate
}

/** Return all slugs — used by generateStaticParams */
export function getAllSlugs(): string[] {
  return articles.map((a) => a.slug)
}

/** Return articles matching a search query (title, ticker, category) */
export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase().trim()
  if (!q) return getAllArticles()
  return getAllArticles().filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.teaser.toLowerCase().includes(q) ||
      a.tickers.some((t) => t.symbol.toLowerCase().includes(q)) ||
      a.tags.some((tag) => tag.toLowerCase().includes(q))
  )
}

/** Return trending articles (top N by recency + featured flag) */
export function getTrendingArticles(limit = 8): Article[] {
  const all = getAllArticles()
  // Featured articles first, then newest
  const featured = all.filter((a) => a.featured)
  const rest = all.filter((a) => !a.featured)
  return [...featured, ...rest].slice(0, limit)
}

/**
 * Return the top articles from the most recent publish date,
 * excluding daily roundup articles (slug starts with "roundup-").
 * Used for the "Today's Top Stock Highlights" section.
 */
export function getTodaysTopArticles(limit = 4): Article[] {
  const all = getAllArticles().filter((a) => !a.slug.startsWith('roundup-'))
  if (all.length === 0) return []
  // Find the most recent date in the dataset
  const latestDate = all[0].date
  const todaysArticles = all.filter((a) => a.date === latestDate)
  return todaysArticles.slice(0, limit)
}

/**
 * Return the display date for the most recent batch of articles.
 * Used to show the date in the "Today's Top Stock Highlights" heading.
 */
export function getLatestPublishDate(): string {
  const all = getAllArticles().filter((a) => !a.slug.startsWith('roundup-'))
  return all.length > 0 ? all[0].date : ''
}
