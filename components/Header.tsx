'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { TrendingUp, Search, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { label: 'Home',           href: '/'                     },
  { label: 'Stock Insights', href: '/stock-insights'        },
  { label: 'My Watchlist',   href: '/watchlist'             },
  { label: 'About',          href: '/about'                 },
  { label: 'Legal',          href: '/legal'                 },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/stock-insights?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Alpha Stocks Insight home">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-sm flex-shrink-0">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-black text-base tracking-tight text-blue-900 dark:text-blue-300">
                Alpha{' '}
                <span className="text-amber-500">Stocks</span>{' '}
                <span className="text-gray-900 dark:text-white">Insight</span>
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks, tickers…"
                aria-label="Search articles"
                className="bg-transparent outline-none w-40 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              />
            </form>

            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* ── Mobile nav dropdown ── */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-2">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Search size={13} className="text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks, tickers…"
                className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              />
            </form>

            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

          </div>
        )}
      </div>
    </header>
  )
}
