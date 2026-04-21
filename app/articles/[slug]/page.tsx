import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { Clock, User, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getArticleBySlug, getAllSlugs, getTrendingArticles } from '@/lib/articles'
import AdPlaceholder from '@/components/AdPlaceholder'
import Disclaimer from '@/components/Disclaimer'
import TrendingSidebar from '@/components/TrendingSidebar'
import TickerBadge from '@/components/TickerBadge'

// ── Static params for SSG ────────────────────────────────────
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

// ── Per-page metadata ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Article Not Found' }

  const tickerStr = article.tickers.map((t) => `${t.exchange}:${t.symbol}`).join(', ')

  return {
    title: article.title,
    description: article.teaser,
    keywords: [
      ...article.tags,
      ...article.tickers.map((t) => t.symbol),
      article.category,
      'stock analysis',
      'investment ideas',
    ],
    authors: [{ name: article.author }],
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.teaser,
      publishedTime: article.dateISO,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tickerStr} — ${article.title}`,
      description: article.teaser,
    },
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
  }
}

// ── Article Page ─────────────────────────────────────────────
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article  = getArticleBySlug(slug)
  if (!article) notFound()

  const trending   = getTrendingArticles(8)
  const contentHtml = await marked.parse(article.content)

  // JSON-LD structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.teaser,
    datePublished: article.dateISO,
    dateModified: article.dateISO,
    author: { '@type': 'Person', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: 'Alpha Stocks Insight',
      logo: { '@type': 'ImageObject', url: 'https://alphastocksinsight.com/logo.png' },
    },
    keywords: article.tags.join(', '),
    articleSection: article.category,
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── AD #1: Top leaderboard ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
          <AdPlaceholder size="728x90" label="Article Page Top (728×90)" className="max-w-3xl" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ═══ ARTICLE BODY ═════════════════════════════════ */}
          <article className="flex-1 min-w-0">

            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 mb-5 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to All Ideas
            </Link>

            {/* Category + meta */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {article.category}
              </span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} />
                {article.time} · {article.date}
              </span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="text-xs text-gray-500">{article.readTime}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black leading-tight text-gray-900 dark:text-white mb-4">
              {article.title}
            </h1>

            {/* Tickers */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {article.tickers.map((t) => (
                <TickerBadge key={`${t.exchange}:${t.symbol}`} ticker={t} size="md" />
              ))}
            </div>

            {/* Author info */}
            <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-200 dark:border-gray-800">
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{article.author}</p>
                <p className="text-xs text-gray-500">{article.authorBio}</p>
              </div>
            </div>

            {/* ── AD #2: In-article ad ── */}
            <div className="my-6">
              <AdPlaceholder size="in-article" label="In-Article Ad (in-article)" />
            </div>

            {/* Teaser / lead */}
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 font-medium mb-6 border-l-4 border-blue-600 pl-4 italic">
              {article.teaser}
            </p>

            {/* ── Full article content (Markdown → HTML) ── */}
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* ── AD #3: Mid-article ── */}
            <div className="my-8">
              <AdPlaceholder size="728x90" label="Mid-Article Leaderboard (728×90)" />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              <Tag size={13} className="text-gray-400" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* ── DISCLAIMER (BOTTOM) — required on every article ── */}
            <Disclaimer variant="article" className="mt-8" />

          </article>

          {/* ═══ SIDEBAR ══════════════════════════════════════ */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-20 flex flex-col gap-5">

              {/* AD #4: Sidebar 300×250 */}
              <AdPlaceholder size="300x250" label="Sidebar Rect (300×250)" />

              {/* Trending */}
              <TrendingSidebar articles={trending} />

              {/* AD #5: Sidebar 300×250 lower */}
              <AdPlaceholder size="300x250" label="Sidebar Rect Lower (300×250)" />

            </div>
          </aside>

        </div>
      </div>
    </>
  )
}
