import Link from 'next/link'
import { Star, Clock, User } from 'lucide-react'
import TickerBadge from '@/components/TickerBadge'
import type { Article } from '@/lib/types'

interface FeaturedGridProps {
  articles: Article[]
}

export default function FeaturedGrid({ articles }: FeaturedGridProps) {
  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black flex items-center gap-2 text-gray-900 dark:text-white">
          <Star size={18} className="text-amber-500" fill="currentColor" />
          Featured Ideas
        </h2>
        <Link
          href="/stock-insights"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`}>
            <article className="h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {article.category}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{article.readTime}</span>
              </div>

              <h3 className="text-base font-bold leading-snug mb-2 text-gray-900 dark:text-white line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm leading-relaxed mb-4 text-gray-600 dark:text-gray-400 line-clamp-2">
                {article.teaser}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-2 mt-auto">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <User size={10} />
                    {article.author}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock size={10} />
                    {article.date}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {article.tickers.map((t) => (
                    <TickerBadge key={`${t.exchange}:${t.symbol}`} ticker={t} />
                  ))}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}
