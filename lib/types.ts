// ============================================================
// TYPE DEFINITIONS — Alpha Stocks Insight
// ============================================================

export interface Ticker {
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX' | string
  symbol: string
}

export interface Article {
  id: number
  slug: string
  title: string
  author: string
  authorBio: string
  date: string         // e.g. "April 20, 2026"
  time: string         // e.g. "9:42 AM ET"
  dateISO: string      // ISO 8601 for sorting & structured data
  teaser: string       // Short preview text
  content: string      // Full article body in Markdown
  tickers: Ticker[]
  category: string       // Primary display category
  sectors: string[]      // All categories this article belongs to (for filtering)
  featured: boolean
  readTime: string     // e.g. "5 min read"
  tags: string[]
  imageUrl?: string    // Optional hero image
}

export interface StockEntry {
  symbol: string
  exchange: string
  name?: string
  sector?: string
  notes?: string
}

export interface MiniQuote {
  symbol: string
  price: string
  change: string
  changePercent: string
  up: boolean
}

export type ArticlesByDate = Record<string, Article[]>
