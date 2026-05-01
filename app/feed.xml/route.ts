import { getAllArticles } from '@/lib/articles'

const BASE_URL = 'https://alphastocksinsight.com'
const FEED_TITLE = 'Alpha Stocks Insight — Stock News & Analysis'
const FEED_DESC  = 'AI-powered stock news and investment analysis covering NYSE and NASDAQ markets. Updated twice daily.'
const FEED_LANG  = 'en-us'

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
}

export async function GET() {
  const articles = getAllArticles().slice(0, 50) // latest 50 articles

  const items = articles.map((article) => {
    const url      = `${BASE_URL}/articles/${article.slug}`
    const pubDate  = new Date(article.dateISO).toUTCString()
    const tickers  = article.tickers.map((t) => `${t.exchange}:${t.symbol}`).join(', ')
    const category = escapeXml(article.category)
    const teaser   = escapeXml(article.teaser)
    const title    = escapeXml(article.title)

    // Tags as <category> elements
    const tagElements = (article.tags ?? [])
      .map((tag) => `    <category>${escapeXml(tag)}</category>`)
      .join('\n')

    return `  <item>
    <title>${title}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${teaser}</description>
    <author>noreply@alphastocksinsight.com (Alpha Stocks Insight Staff)</author>
    <category>${category}</category>
${tagElements}
    ${tickers ? `<dc:subject>${escapeXml(tickers)}</dc:subject>` : ''}
  </item>`
  }).join('\n')

  const lastBuildDate = articles.length > 0
    ? new Date(articles[0].dateISO).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${FEED_TITLE}</title>
    <link>${BASE_URL}</link>
    <description>${FEED_DESC}</description>
    <language>${FEED_LANG}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>${FEED_TITLE}</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  })
}
