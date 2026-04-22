import type { Metadata } from 'next'
import AdPlaceholder from '@/components/AdPlaceholder'
import ArticleCard from '@/components/ArticleCard'
import FeaturedGrid from '@/components/FeaturedGrid'
import HeroBanner from '@/components/HeroBanner'
import TrendingSidebar from '@/components/TrendingSidebar'
import Disclaimer from '@/components/Disclaimer'
import {
  getArticlesByDate,
  getTodaysTopArticles,
  getLatestPublishDate,
  getTrendingArticles,
} from '@/lib/articles'

export const metadata: Metadata = {
  title: 'Alpha Stocks Insight | US Stock News & Investment Ideas',
  description:
    'Daily AI-powered US stock news, independent investment ideas, and market analysis covering NASDAQ and NYSE stocks.',
}

export default function HomePage() {
  const topArticles  = getTodaysTopArticles(4)
  const latestDate   = getLatestPublishDate()
  const trending     = getTrendingArticles(8)
  const byDate       = getArticlesByDate()
  const dateGroups   = Object.entries(byDate) // already sorted newest-first

  return (
    <>
      {/* ── AD #1: Top Leaderboard 728×90 ─────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
          <AdPlaceholder size="728x90" label="Top Leaderboard (728×90)" className="max-w-3xl" />
        </div>
      </div>

      {/* ── Hero Banner ────────────────────────────────────── */}
      <HeroBanner />

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ═══ LEFT / MAIN COLUMN ═══════════════════════════ */}
          <div className="flex-1 min-w-0">

            {/* Today's Top Stock Highlights */}
            <FeaturedGrid articles={topArticles} date={latestDate} />

            {/* AD #2: In-content native */}
            <div className="mb-6">
              <AdPlaceholder size="native" label="In-Content Native Ad" />
            </div>

            {/* All Articles grouped by date */}
            <section>
              <h2 className="text-lg font-black mb-5 pb-3 border-b-2 border-blue-800 dark:border-blue-900 text-gray-900 dark:text-white">
                All Stock Ideas &amp; News
              </h2>

              {dateGroups.map(([date, articles], groupIndex) => (
                <div key={date} className="mb-7">
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-black uppercase tracking-wide text-blue-800 dark:text-blue-400">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {articles.length} article{articles.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Article cards */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 divide-y divide-gray-100 dark:divide-gray-800">
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>

                  {/* AD #3: After 2nd date group */}
                  {groupIndex === 1 && (
                    <div className="mt-5">
                      <AdPlaceholder size="728x90" label="Mid-Page Leaderboard (728×90)" />
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* AD #4: Bottom of main column */}
            <div className="mt-4">
              <AdPlaceholder size="728x90" label="Bottom Leaderboard (728×90)" />
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ════════════════════════════════ */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-20 flex flex-col gap-5">

              {/* AD #5: Sidebar 300×250 */}
              <AdPlaceholder size="300x250" label="Sidebar Rectangle (300×250)" />

              {/* Trending */}
              <TrendingSidebar articles={trending} />

              {/* AD #6: Sidebar 300×250 (lower) */}
              <AdPlaceholder size="300x250" label="Sidebar Rectangle Lower (300×250)" />

              {/* Quick disclaimer */}
              <Disclaimer variant="box" />

              {/* Newsletter signup */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
                <p className="font-bold text-sm mb-1 text-blue-900 dark:text-blue-200">
                  📬 Daily Stock Ideas
                </p>
                <p className="text-xs mb-3 text-blue-700 dark:text-blue-400">
                  Top ideas delivered to your inbox every morning before market open.
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-1.5 rounded-lg text-sm border border-blue-200 dark:border-blue-800 mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="w-full bg-blue-700 hover:bg-blue-600 text-white text-sm py-2 rounded-lg font-semibold transition-colors">
                  Subscribe Free
                </button>
                <p className="text-xs text-blue-500 dark:text-blue-600 mt-1.5 text-center">
                  No spam · Unsubscribe anytime
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </>
  )
}
