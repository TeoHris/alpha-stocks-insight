import type { Metadata } from 'next'
import { Bot, Key, Database, FileText, Zap, Code } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Agent Instructions',
  description: 'How to connect Claude AI agents to Alpha Stocks Insight for automated article generation.',
}

export default function AIAgentInstructionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">AI Agent Instructions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">How to automate article generation with Claude</p>
        </div>
      </div>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300">

        <p className="text-base leading-relaxed">
          This page explains how to connect Claude AI agents (via Anthropic API) to automatically
          generate new stock analysis articles for Alpha Stocks Insight. Agents pull real-time
          data from public APIs, synthesize it into original analysis, and write it to the articles
          JSON file.
        </p>

        {/* Architecture overview */}
        <section>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap size={18} className="text-purple-500" />
            Architecture Overview
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="space-y-2 font-mono text-xs">
              <div className="text-gray-500">┌─────────────────────────────────────────┐</div>
              <div className="text-gray-500">│  Admin uploads stock list (CSV/JSON)    │</div>
              <div className="text-gray-500">│  → stored in data/tickers.json          │</div>
              <div className="text-gray-500">└──────────────┬──────────────────────────┘</div>
              <div className="text-gray-500">               │</div>
              <div className="text-gray-500">               ▼</div>
              <div className="text-gray-500">┌─────────────────────────────────────────┐</div>
              <div className="text-gray-500">│  Claude Agent (scheduled or on-demand)  │</div>
              <div className="text-gray-500">│  1. Read tickers.json                   │</div>
              <div className="text-gray-500">│  2. Fetch news from Finnhub/AV/RSS      │</div>
              <div className="text-gray-500">│  3. Generate article via Claude API     │</div>
              <div className="text-gray-500">│  4. Append to data/articles.json        │</div>
              <div className="text-gray-500">│  5. Trigger site rebuild (if Vercel)    │</div>
              <div className="text-gray-500">└─────────────────────────────────────────┘</div>
            </div>
          </div>
        </section>

        {/* Step 1: API Keys */}
        <section>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Key size={18} className="text-yellow-500" />
            Step 1: Get Your API Keys
          </h2>
          <div className="space-y-3">
            {[
              {
                name: 'Anthropic API (Claude)',
                url: 'https://console.anthropic.com',
                desc: 'Required to run Claude agents. Create an account and generate an API key. Recommended model: claude-opus-4-6 for analysis quality, claude-haiku-4-5-20251001 for speed/cost.',
                env: 'ANTHROPIC_API_KEY',
              },
              {
                name: 'Finnhub',
                url: 'https://finnhub.io',
                desc: 'Best free-tier stock news API. The company-news endpoint returns real-time news per ticker. Free tier: 60 API calls/minute.',
                env: 'FINNHUB_API_KEY',
              },
              {
                name: 'Alpha Vantage',
                url: 'https://www.alphavantage.co',
                desc: 'Excellent for stock quotes + news sentiment. Free tier: 25 calls/day (sufficient for daily article generation).',
                env: 'ALPHA_VANTAGE_API_KEY',
              },
            ].map((api) => (
              <div key={api.name} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{api.name}</h3>
                  <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{api.url} ↗</a>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{api.desc}</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">{api.env}=your_key_here</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Store all API keys in a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code> file (never commit to git).
          </p>
        </section>

        {/* Step 2: Agent prompt */}
        <section>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText size={18} className="text-green-500" />
            Step 2: Agent System Prompt Template
          </h2>
          <p className="mb-3">
            Use this system prompt when creating your Claude agent. It instructs Claude to generate
            articles in the correct format for this site:
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`You are a financial news analyst for Alpha Stocks Insight.
Your task: Generate a professional stock analysis article.

INPUT: You will receive:
- A stock ticker (e.g., NASDAQ:NVDA)
- Recent news headlines and data for that stock
- Today's date

OUTPUT: Return a JSON object matching this exact schema:
{
  "id": <next_available_integer>,
  "slug": "<kebab-case-title>",
  "title": "<compelling headline, 60-100 chars>",
  "author": "<one of: Marcus Chen, Sarah Mitchell, James Rivera, Emma Thornton, David Park, Lisa Wang, Robert Kim, Michael Torres>",
  "authorBio": "<one-sentence bio for the author>",
  "date": "<e.g., April 20, 2026>",
  "time": "<e.g., 9:42 AM ET>",
  "dateISO": "<ISO 8601 datetime>",
  "teaser": "<2-3 sentence summary, 150-200 chars>",
  "content": "<FULL article in Markdown, 600-1200 words, with ## headers>",
  "tickers": [{"exchange": "NASDAQ", "symbol": "NVDA"}],
  "category": "<one of: Earnings Preview, Earnings, Stock Analysis, Technology, Semiconductors, Cloud Computing, AI & Technology, Big Tech, Government & Defense, AI Infrastructure>",
  "featured": false,
  "readTime": "<X min read>",
  "tags": ["tag1", "tag2", "tag3"]
}

RULES:
- Content must include sections: analysis, key metrics, risks, conclusion
- Always end content with: "*This analysis is for informational purposes only.*"
- Use factual, measured language — not hype
- Include specific numbers and data points from the provided news
- Do NOT invent financial figures — only use what was provided
- Do NOT provide a buy/sell recommendation`}
          </div>
        </section>

        {/* Step 3: Agent script */}
        <section>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Code size={18} className="text-blue-500" />
            Step 3: Agent Script (Node.js / Python)
          </h2>
          <p className="mb-3">
            Create a script that: (1) reads your ticker list, (2) fetches news from Finnhub,
            (3) calls Claude to generate the article, (4) appends it to articles.json.
            Run it via a cron job or GitHub Action for automated daily publishing.
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`# agents/generate_articles.py
import json, os, datetime, httpx
import anthropic

client   = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
finnhub_key = os.environ["FINNHUB_API_KEY"]

# 1. Load ticker list
with open("data/tickers.json") as f:
    tickers = json.load(f)

# 2. Load existing articles (to get next ID)
with open("data/articles.json") as f:
    articles = json.load(f)

next_id = max(a["id"] for a in articles) + 1

# 3. For each ticker, fetch news + generate article
for ticker in tickers[:3]:  # limit to 3 per run
    sym = ticker["symbol"]

    # Fetch latest news from Finnhub
    url = f"https://finnhub.io/api/v1/company-news?symbol={sym}&from={datetime.date.today()}&to={datetime.date.today()}&token={finnhub_key}"
    news = httpx.get(url).json()[:5]  # top 5 headlines

    news_text = "\\n".join([f"- {n['headline']}: {n['summary'][:200]}" for n in news])

    # 4. Call Claude to generate article
    msg = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        system=SYSTEM_PROMPT,  # paste the prompt from Step 2
        messages=[{
            "role": "user",
            "content": f"Generate an article for {ticker['exchange']}:{sym}\\n\\nRecent news:\\n{news_text}\\n\\nToday: {datetime.date.today()}"
        }]
    )

    # 5. Parse and append article
    article = json.loads(msg.content[0].text)
    article["id"] = next_id
    next_id += 1
    articles.insert(0, article)

# 6. Save updated articles.json
with open("data/articles.json", "w") as f:
    json.dump(articles, f, indent=2)

print(f"Generated {len(tickers[:3])} new articles.")`}
          </div>
        </section>

        {/* Step 4: Deployment */}
        <section>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Database size={18} className="text-orange-500" />
            Step 4: Automate with GitHub Actions
          </h2>
          <p className="mb-3">
            Create <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.github/workflows/generate_articles.yml</code>:
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`name: Generate Daily Articles
on:
  schedule:
    - cron: '0 7 * * 1-5'  # 7 AM UTC, weekdays
  workflow_dispatch:        # manual trigger
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install anthropic httpx
      - run: python agents/generate_articles.py
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
          FINNHUB_API_KEY: \${{ secrets.FINNHUB_API_KEY }}
      - name: Commit and push new articles
        run: |
          git config user.name "AI Agent"
          git config user.email "agent@alphastocksinsight.com"
          git add data/articles.json
          git commit -m "chore: add daily AI-generated articles"
          git push
          # Vercel auto-deploys on push to main ✓`}
          </div>
        </section>

        <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 p-4">
          <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
            <strong>Note:</strong> All AI-generated articles must include the standard disclaimer
            (already included in the article page component). Review article output occasionally
            to ensure quality and factual accuracy. Never use generated financial figures that
            are not grounded in real data sources.
          </p>
        </div>

      </div>
    </div>
  )
}
