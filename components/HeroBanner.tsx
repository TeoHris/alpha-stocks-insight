import { BarChart2, Clock, TrendingUp } from 'lucide-react'

interface HeroBannerProps {
  articleCount: number
}

export default function HeroBanner({ articleCount }: HeroBannerProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            Live Market Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">
          Latest US Stock News
        </h1>
        <p className="text-blue-200 text-sm sm:text-base mb-4 max-w-2xl">
          AI-powered independent analysis and research on the stocks that matter most to US investors.
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-300">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {today}
          </span>
          <span className="text-blue-700">·</span>
          <span className="flex items-center gap-1.5">
            <BarChart2 size={11} />
            {articleCount} articles published
          </span>
          <span className="text-blue-700">·</span>
          <span className="flex items-center gap-1.5">
            <TrendingUp size={11} />
            NYSE &amp; NASDAQ Coverage
          </span>
        </div>
      </div>
    </div>
  )
}
