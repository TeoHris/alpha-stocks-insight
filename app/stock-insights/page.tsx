import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import AdPlaceholder from '@/components/AdPlaceholder'
import { BarChart2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Stock Insights',
  description:
    'Browse all AI-powered stock analysis and investment ideas covering NASDAQ and NYSE stocks.',
}

// Category filter options — aligned with S&P sector classifications
const CATEGORIES = [
  'All',
  'Earnings Report',
  'Stock Analysis',
  'Technology',
  'Health Care',
  'Financials',
  'Industrials',
  'Consumer',
  'Energy',
  'Real Estate',
  'Communication Services',
  'Materials',
]

export default async function StockInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const activeCategory = cat && CATEGORIES.includes(cat) ? cat : 'All'

  const allArticles = getAllArticles()
  const articles =
    activeCategory === 'All'
      ? allArticles
      : allArticles.filter((a) => a.category === activeCategory)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 size={24} className="text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Stock Insights</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered stock news and analysis across NYSE and NASDAQ, newest first.
        </p>
      </div>

      {/* ── AD #1 ── */}
      <div className="mb-6">
        <AdPlaceholder size="728x90" label="Stock Insights Top (728×90)" />
      </div>

      {/* ── Category filter chips ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory
          const href = cat === 'All' ? '/stock-insights' : `/stock-insights?cat=${encodeURIComponent(cat)}`
          return (
            <a
              key={cat}
              href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? 'bg-blue-700 border-blue-700 text-white dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              {cat}
            </a>
          )
        })}
      </div>

      {/* ── Article List ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {articles.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-10 text-center text-gray-500 dark:text-gray-400">
              No articles in this category yet.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 divide-y divide-gray-100 dark:divide-gray-800">
              {articles.map((article, i) => (
                <div key={article.id}>
                  <ArticleCard article={article} />
                  {/* AD #2: In-list after every 5 articles */}
                  {i > 0 && i % 5 === 0 && (
                    <div className="py-4">
                      <AdPlaceholder size="native" label={`In-List Native Ad (after article ${i + 1})`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AD #3: Bottom */}
          <div className="mt-6">
            <AdPlaceholder size="728x90" label="Bottom Leaderboard (728×90)" />
          </div>
        </div>

        {/* Sidebar ad */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">
            <AdPlaceholder size="300x250" label="Sidebar Rect (300×250)" />
            <AdPlaceholder size="300x250" label="Sidebar Rect Lower (300×250)" />
          </div>
        </aside>
      </div>

    </div>
  )
}
