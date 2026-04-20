# Alpha Stocks Insight

**Production-ready Next.js 15 finance news website** — AI-powered US stock news and investment ideas.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000
```

## 📁 Project Structure

```
alpha-stocks-insight/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (header, footer, providers)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind + global styles
│   ├── providers.tsx             # next-themes ThemeProvider
│   ├── articles/[slug]/page.tsx  # Dynamic article page
│   ├── stock-insights/page.tsx   # All articles listing
│   ├── watchlist/page.tsx        # Personal watchlist (localStorage)
│   ├── about/page.tsx            # About page
│   ├── legal/page.tsx            # Legal, disclaimer, privacy, GDPR
│   ├── admin/page.tsx            # Stock list upload (CSV/JSON)
│   ├── ai-agent-instructions/    # How to connect Claude agents
│   ├── sitemap.ts                # Dynamic XML sitemap
│   └── robots.ts                 # robots.txt
├── components/
│   ├── Header.tsx                # Sticky nav (client)
│   ├── Footer.tsx                # Footer with links + disclaimer
│   ├── AdPlaceholder.tsx         # Google AdSense placeholder
│   ├── Disclaimer.tsx            # Reusable disclaimer (bar/box/article)
│   ├── ThemeToggle.tsx           # Dark/light mode button (client)
│   ├── ArticleCard.tsx           # Article list item
│   ├── FeaturedGrid.tsx          # Featured articles 2-col grid
│   ├── TrendingSidebar.tsx       # Numbered trending list
│   ├── HeroBanner.tsx            # Hero section with ticker strip
│   └── TickerBadge.tsx           # NASDAQ:NVDA style badge
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   └── articles.ts               # Data access functions
├── data/
│   ├── articles.json             # Sample articles (10 full articles)
│   └── tickers.json              # Default ticker list
├── public/
│   └── sample-tickers.csv        # Template for stock list upload
├── next.config.ts
├── tailwind.config.ts
├── vercel.json
└── package.json
```

## ✏️ Adding Articles

**Manually**: Add objects to `data/articles.json` following the existing schema.

**Via AI Agent**: See `/ai-agent-instructions` page in the app. Use the provided Python script + GitHub Actions workflow for automated daily generation via Finnhub + Claude.

## 🎯 Ad Monetization Setup

All `<AdPlaceholder>` components contain commented instructions. To enable:

1. Sign up for Google AdSense at https://adsense.google.com
2. Uncomment the `<Script>` tag in `app/layout.tsx` with your Publisher ID
3. Replace the placeholder `<div>` in `components/AdPlaceholder.tsx` with your `<ins>` tags

Ad placement summary (5+ placements per page):
- `728x90` — Top leaderboard (above hero)
- `native` — In-content after Featured Ideas
- `728x90` — Mid-page after 2nd date group
- `728x90` — Bottom of main column
- `300x250` — Sidebar (top)
- `300x250` — Sidebar (lower)
- `320x50` — Footer banner

## 🌙 Dark Mode

Handled by `next-themes`. Toggle is in the header. Default is `light`; respects system preference with `enableSystem`.

## 🔍 SEO

- `generateMetadata()` on every page (title, description, OG, Twitter card)
- JSON-LD `NewsArticle` structured data on article pages
- `app/sitemap.ts` generates dynamic XML sitemap at `/sitemap.xml`
- `app/robots.ts` generates robots.txt at `/robots.txt`
- Semantic HTML throughout (`<header>`, `<article>`, `<aside>`, `<nav>`)

Before deploying, update `BASE_URL` in `app/sitemap.ts` and `app/robots.ts`.

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repo to vercel.com for auto-deploy on push
```

## 🤖 AI Agent Integration

See the `/ai-agent-instructions` page in the app, or `app/ai-agent-instructions/page.tsx` for:
- Complete system prompt template for Claude
- Python script for fetching Finnhub news + generating articles
- GitHub Actions workflow for daily automated publishing

Recommended free data sources (2026):
1. **Finnhub** (finnhub.io) — best free stock news API
2. **Alpha Vantage** — quotes + news sentiment
3. **Yahoo Finance RSS** — simple headline feeds

## 📋 Legal Notes

All pages include the required disclaimer. The full text is in `components/Disclaimer.tsx`. It covers:
- US (non-SEC-registered)
- EU (non-MiFID II)
- Switzerland (non-FINSA)

---

Built with Next.js 15, Tailwind CSS, TypeScript, and next-themes.
