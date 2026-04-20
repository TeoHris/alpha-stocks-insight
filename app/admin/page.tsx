'use client'

// ============================================================
// ADMIN PAGE — Stock List Upload
// ============================================================
// This page allows you to upload a CSV or JSON file of stock
// tickers that AI agents will generate articles about.
//
// STORAGE: Tickers are stored in localStorage for now.
// FUTURE:  Replace localStorage calls with API calls to your
//          backend when you connect a real database.
//
// CSV FORMAT:
//   symbol,exchange,name,sector
//   NVDA,NASDAQ,NVIDIA Corporation,Semiconductors
//   PLTR,NYSE,Palantir Technologies Inc.,AI Analytics
//
// JSON FORMAT:
//   [{"symbol":"NVDA","exchange":"NASDAQ","name":"NVIDIA","sector":"Semiconductors"}]
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Download, Info, CheckCircle } from 'lucide-react'
import type { StockEntry } from '@/lib/types'

const STORAGE_KEY = 'alpha-stocks-tickerlist'

export default function AdminPage() {
  const [tickers, setTickers]     = useState<StockEntry[]>([])
  const [status, setStatus]       = useState<string>('')
  const [error, setError]         = useState<string>('')
  const [mounted, setMounted]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setTickers(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  function save(list: StockEntry[]) {
    setTickers(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    setStatus('')
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text) as StockEntry[]
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array of ticker objects')
        save(parsed)
        setStatus(`✅ Loaded ${parsed.length} tickers from JSON file.`)
      } else if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n')
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
        const symIdx  = headers.indexOf('symbol')
        const exIdx   = headers.indexOf('exchange')
        const nameIdx = headers.indexOf('name')
        const secIdx  = headers.indexOf('sector')

        if (symIdx === -1) throw new Error('CSV must have a "symbol" column')

        const parsed: StockEntry[] = lines.slice(1)
          .filter(l => l.trim())
          .map(line => {
            // Handle quoted fields
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
            return {
              symbol:   cols[symIdx]?.toUpperCase() ?? '',
              exchange: cols[exIdx]  ?? 'NASDAQ',
              name:     cols[nameIdx] ?? undefined,
              sector:   cols[secIdx]  ?? undefined,
            }
          })
          .filter(t => t.symbol)

        save(parsed)
        setStatus(`✅ Loaded ${parsed.length} tickers from CSV file.`)
      } else {
        throw new Error('Please upload a .csv or .json file.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(tickers, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'tickers.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function removeEntry(sym: string) {
    save(tickers.filter(t => t.symbol !== sym))
  }

  if (!mounted) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Upload size={22} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Stock List Admin</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Upload your curated list of US stock tickers. AI agents will generate articles
        about these stocks. Data is stored locally in your browser.
      </p>

      {/* Info box */}
      <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4 mb-6 flex items-start gap-2">
        <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <p><strong>CSV format:</strong> symbol, exchange, name, sector (header row required)</p>
          <p><strong>JSON format:</strong> Array of objects with symbol, exchange, name, sector fields</p>
          <p>
            <a href="/sample-tickers.csv" download className="underline">Download sample CSV ↓</a>
          </p>
        </div>
      </div>

      {/* Upload area */}
      <div
        className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center mb-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={32} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Click to upload or drag &amp; drop
        </p>
        <p className="text-xs text-gray-400">.csv or .json · Max 1MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Status / error */}
      {status && (
        <div className="flex items-center gap-2 mb-4 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">
          <CheckCircle size={14} />
          {status}
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Current ticker list */}
      {tickers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">
              Current List ({tickers.length} tickers)
            </h2>
            <div className="flex gap-2">
              <button onClick={exportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Download size={12} /> Export JSON
              </button>
              <button onClick={() => { save([]); setStatus('List cleared.') }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                <Trash2 size={12} /> Clear All
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {tickers.map((t) => (
              <div key={t.symbol} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                    <span className="opacity-70">{t.exchange}:</span>{t.symbol}
                  </span>
                  {t.name && <span className="text-sm text-gray-600 dark:text-gray-400">{t.name}</span>}
                  {t.sector && <span className="text-xs text-gray-400 dark:text-gray-600">{t.sector}</span>}
                </div>
                <button onClick={() => removeEntry(t.symbol)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI agent instructions teaser */}
      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">🤖 Connecting AI Agents</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Once your stock list is uploaded, you can configure Claude AI agents to read this list,
          pull the latest news from Finnhub or Alpha Vantage, and generate new articles automatically.
          See the{' '}
          <a href="/ai-agent-instructions" className="text-blue-600 dark:text-blue-400 underline">
            AI Agent Instructions page
          </a>{' '}
          for detailed setup steps.
        </p>
      </div>
    </div>
  )
}
