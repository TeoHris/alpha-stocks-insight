import { BarChart2, Clock, TrendingUp } from 'lucide-react'

interface HeroBannerProps {
  articleCount: number
}

// Indicative demo quotes — replace with real Finnhub/Alpha Vantage API data
const DEMO_QUOTES = [
  { sym: 'NVDA',  price: '942.30', chg: '+3.2%',  up: true  },
  { sym: 'AAPL',  price: '213.45', chg: '+0.8%',  up: true  },
  { sym: 'TSLA',  price: '287.10', chg: '-1.3%',  up: false },
  { sym: 'MSFT',  price: '456.20', chg: '+1.1%',  up: true  },
  { sym: 'AMZN',  price: '201.85', chg: '+2.4%',  up: true  },
  { sym: 'META',  price: '580.70', chg: '+1.9%',  up: true  },
  { sym: 'GOOGL', price: '198.40', chg: '-0.4%',  up: false },
  { sym: 'AMD',   price: '178.55', chg: '+4.2%',  up: true  },
]

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
          Latest US Stock News &amp; Investment Ideas
        </h1>
        <p className="text-blue-200 text-sm sm:text-base mb-4 max-w-2xl">
          AI-powered independent analysis and research on the stocks that matter most to US investors.
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-300 mb-5">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {today}
          </span>
          <span className="text-blue-700">·</span>
          <span className="flex items-center gap-1.5">
            <BarChart2 size={11} />
            {articleCount} ideas published
          </span>
          <span className="text-blue-700">·</span>
          <span className="flex items-center gap-1.5">
            <TrendingUp size={11} />
            NYSE &amp; NASDAQ Coverage
          </span>
        </div>

        {/* Mini ticker strip */}
        {/* TODO: Replace DEMO_QUOTES with real-time data from Finnhub or Alpha Vantage */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DEMO_QUOTES.map((q) => (
            <div
              key={q.sym}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-950/60 border border-blue-800 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <span className="font-bold font-mono text-white">{q.sym}</span>
              <span className="text-blue-200">{q.price}</span>
              <span className={`font-semibold ${q.up ? 'text-green-400' : 'text-red-400'}`}>
                {q.chg}
              </span>
            </div>
          ))}
          <span className="text-blue-500 text-xs flex-shrink-0 pl-1 italic">
            Prices indicative · 15-min delay
          </span>
        </div>
      </div>
    </div>
  )
}
