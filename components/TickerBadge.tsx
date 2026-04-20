import type { Ticker } from '@/lib/types'

interface TickerBadgeProps {
  ticker: Ticker
  size?: 'sm' | 'md'
}

export default function TickerBadge({ ticker, size = 'sm' }: TickerBadgeProps) {
  const base =
    size === 'md'
      ? 'px-3 py-1 text-sm'
      : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono font-semibold rounded border
        bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800
        text-blue-700 dark:text-blue-300 ${base}`}
    >
      <span className="opacity-70">{ticker.exchange}:</span>
      <span>{ticker.symbol}</span>
    </span>
  )
}
