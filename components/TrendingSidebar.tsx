import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { Article } from '@/lib/types'

interface TrendingSidebarProps {
  articles: Article[]
}

export default function TrendingSidebar({ articles }: TrendingSidebarProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <h3 className="font-black text-base flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
        <TrendingUp size={16} className="text-red-500" />
        Trending Stock Ideas
      </h3>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {articles.map((article, idx) => (
          <div key={article.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 group cursor-pointer">
            {/* Rank number */}
            <span
              className={`text-xl font-black w-7 flex-shrink-0 leading-none select-none ${
                idx < 3
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-200 dark:text-gray-700'
              }`}
            >
              {idx + 1}
            </span>

            <div className="min-w-0 flex-1">
              <Link href={`/articles/${article.slug}`}>
                <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:underline transition-colors">
                  {article.title}
                </p>
              </Link>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {article.tickers.map((t) => (
                  <span
                    key={`${t.exchange}:${t.symbol}`}
                    className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {t.exchange}:{t.symbol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
