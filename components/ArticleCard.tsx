import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import TickerBadge from '@/components/TickerBadge'
import type { Article } from '@/lib/types'

interface ArticleCardProps {
  article: Article
  featured?: boolean
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <article
      className={`py-5 border-b last:border-b-0 border-gray-100 dark:border-gray-800/70
        ${featured ? 'pb-6' : ''}`}
    >
      {/* Category + timestamp */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          {article.category}
        </span>
        <span className="text-gray-300 dark:text-gray-700 text-xs">·</span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <Clock size={10} />
          {article.time} · {article.date}
        </span>
      </div>

      {/* Title */}
      <Link href={`/articles/${article.slug}`}>
        <h3
          className={`font-semibold leading-snug mb-2 text-gray-900 dark:text-white
            hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer
            ${featured ? 'text-lg' : 'text-base'}`}
        >
          {article.title}
        </h3>
      </Link>

      {/* Teaser */}
      <p className="text-sm leading-relaxed mb-3 text-gray-600 dark:text-gray-400 line-clamp-3">
        {article.teaser}
      </p>

      {/* Footer: author + tickers */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <User size={10} />
            {article.author}
          </span>
          <span className="text-gray-300 dark:text-gray-700 text-xs">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{article.readTime}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {article.tickers.map((t) => (
            <TickerBadge key={`${t.exchange}:${t.symbol}`} ticker={t} />
          ))}
        </div>
      </div>
    </article>
  )
}
