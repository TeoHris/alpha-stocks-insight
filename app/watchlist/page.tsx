'use client'

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { StockEntry } from '@/lib/types'

const STORAGE_KEY = 'alpha-stocks-watchlist'

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<StockEntry[]>([])
  const [symbol, setSymbol]       = useState('')
  const [exchange, setExchange]   = useState('NASDAQ')
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setWatchlist(JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }, [])

  function save(list: StockEntry[]) {
    setWatchlist(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  function addTicker() {
    const sym = symbol.trim().toUpperCase()
    if (!sym) return
    if (watchlist.some((w) => w.symbol === sym)) return
    save([...watchlist, { symbol: sym, exchange }])
    setSymbol('')
  }

  function remove(sym: string) {
    save(watchlist.filter((w) => w.symbol !== sym))
  }

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Loading watchlist…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Star size={24} className="text-amber-500" fill="currentColor" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Watchlist</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Add tickers you want to follow. Stored locally in your browser.
        When articles covering these stocks are published, they will be highlighted.
      </p>

      {/* ── Add ticker form ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 mb-6">
        <h2 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">Add a Ticker</h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
            <option value="AMEX">AMEX</option>
          </select>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addTicker()}
            placeholder="e.g. NVDA"
            maxLength={6}
            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTicker}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>

      {/* ── Watchlist ── */}
      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Star size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your watchlist is empty.</p>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
            Add tickers above to start tracking stocks.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {watchlist.map((entry) => (
            <div key={entry.symbol} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                  <span className="opacity-70">{entry.exchange}:</span>
                  {entry.symbol}
                </span>
                {entry.name && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/stock-insights?q=${entry.symbol}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View ideas
                </Link>
                <button
                  onClick={() => remove(entry.symbol)}
                  aria-label={`Remove ${entry.symbol}`}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">
        Watchlist data is stored only in your browser (localStorage). It will not sync across devices.
      </p>
    </div>
  )
}
