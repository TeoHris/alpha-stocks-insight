#!/usr/bin/env python3
"""
Alpha Stocks Insight — AI Article Generator
============================================
Fetches the latest stock news from Finnhub and uses Claude AI
to write full investment analysis articles, then saves them
directly into data/articles.json so they appear on your site.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SETUP (one-time, takes 2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install dependencies (run this once in your terminal):
      pip install anthropic requests python-dotenv

2. Get your FREE Finnhub API key:
      Go to https://finnhub.io  →  Sign Up  →  copy your API key

3. Get your Anthropic API key:
      Go to https://console.anthropic.com  →  API Keys  →  Create key

4. Create a file called  .env  in this folder with:
      ANTHROPIC_API_KEY=sk-ant-your-key-here
      FINNHUB_API_KEY=your-finnhub-key-here

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # Generate articles for ALL tickers in data/tickers.json
  python generate_articles.py

  # Generate for specific tickers only
  python generate_articles.py NVDA AAPL MSFT

  # Limit how many articles are written per run
  python generate_articles.py --max 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AFTER RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  git add . && git commit -m "Add AI articles" && git push

  Vercel will publish them live within ~60 seconds.
"""

import os
import sys
import json
import time
import datetime
import re
import argparse
import requests
from pathlib import Path

# ── Load .env file if present ─────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed — keys must be set manually

# ── Config ────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FINNHUB_API_KEY   = os.getenv("FINNHUB_API_KEY", "")

SCRIPT_DIR    = Path(__file__).parent
ARTICLES_FILE = SCRIPT_DIR / "data" / "articles.json"
TICKERS_FILE  = SCRIPT_DIR / "data" / "tickers.json"

# How many days of news to look back
NEWS_LOOKBACK_DAYS = 3

# Categories to rotate through
CATEGORIES = [
    "Stock Analysis",
    "Earnings Preview",
    "AI & Technology",
    "Semiconductors",
    "Cloud Computing",
    "Big Tech",
    "AI Infrastructure",
    "Technology",
]

AUTHOR_NAME = "Alpha Stocks Insight Research Team"
AUTHOR_BIO  = "AI-powered analysis covering NASDAQ and NYSE stocks."


# ─────────────────────────────────────────────────────────────
# STEP 1 — Fetch news headlines from Finnhub
# ─────────────────────────────────────────────────────────────

def fetch_news(symbol: str) -> list[dict]:
    """Return recent news items for a stock symbol from Finnhub."""
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=NEWS_LOOKBACK_DAYS)

    url = "https://finnhub.io/api/v1/company-news"
    params = {
        "symbol": symbol,
        "from":   start.isoformat(),
        "to":     end.isoformat(),
        "token":  FINNHUB_API_KEY,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        items = resp.json()
        # Return up to 5 most recent items that have a headline and summary
        return [i for i in items if i.get("headline") and i.get("summary")][:5]
    except Exception as e:
        print(f"  ⚠  Could not fetch news for {symbol}: {e}")
        return []


# ─────────────────────────────────────────────────────────────
# STEP 2 — Generate the article with Claude
# ─────────────────────────────────────────────────────────────

def generate_article(ticker: dict, news_items: list[dict]) -> dict | None:
    """Call Claude to write a full article and return a structured dict."""

    try:
        import anthropic
    except ImportError:
        print("ERROR: 'anthropic' package not installed. Run:  pip install anthropic")
        sys.exit(1)

    symbol   = ticker["symbol"]
    exchange = ticker.get("exchange", "NASDAQ")
    name     = ticker.get("name", symbol)
    sector   = ticker.get("sector", "Technology")

    # Format news for the prompt
    news_text = ""
    for i, item in enumerate(news_items, 1):
        news_text += f"\n{i}. HEADLINE: {item['headline']}\n"
        if item.get("summary"):
            news_text += f"   SUMMARY: {item['summary'][:400]}\n"
        if item.get("source"):
            news_text += f"   SOURCE: {item['source']}\n"

    today = datetime.date.today()
    date_str = today.strftime("%B %d, %Y").replace(" 0", " ")  # e.g. "April 20, 2026"
    time_str = "9:00 AM ET"

    prompt = f"""You are a financial analyst writing for Alpha Stocks Insight, a US stock analysis website.

Write a professional, insightful investment analysis article about {name} ({exchange}:{symbol}), a {sector} company.

Use these recent news headlines as your source material:
{news_text}

Write the article in this EXACT JSON format (return ONLY valid JSON, no markdown code blocks):
{{
  "title": "<compelling article title mentioning the stock>",
  "teaser": "<2-sentence preview that hooks the reader, max 180 characters>",
  "category": "<one of: Stock Analysis | Earnings Preview | AI & Technology | Semiconductors | Cloud Computing | Big Tech | AI Infrastructure | Technology>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "featured": false,
  "readTime": "<X min read>",
  "content": "<full article in Markdown, 450-650 words>"
}}

Requirements for the content field (Markdown):
- Use ## for section headings (2-3 sections)
- Include a "### Key Takeaways" section with 3-4 bullet points at the end
- Mention specific data points from the news headlines
- Include a brief risk/bear case paragraph
- Professional tone, avoid hype
- Do NOT include the title again at the start of the content
- Do NOT include any disclaimer — the site adds that automatically

Return ONLY the raw JSON object. No explanation, no markdown fences."""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    try:
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
    except Exception as e:
        print(f"  ✗  Claude API error for {symbol}: {e}")
        return None

    # Strip markdown fences if Claude added them anyway
    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  ✗  JSON parse error for {symbol}: {e}")
        print(f"     Raw response (first 300 chars): {raw[:300]}")
        return None

    # Build the full article record
    slug = f"{symbol.lower()}-{re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')[:60]}"
    now  = datetime.datetime.now()

    article = {
        "id":        None,           # will be assigned below
        "slug":      slug,
        "title":     data["title"],
        "author":    AUTHOR_NAME,
        "authorBio": AUTHOR_BIO,
        "date":      date_str,
        "time":      now.strftime("%I:%M %p ET").lstrip("0"),
        "dateISO":   now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "teaser":    data["teaser"],
        "content":   data["content"],
        "tickers":   [{"exchange": exchange, "symbol": symbol}],
        "category":  data.get("category", "Stock Analysis"),
        "featured":  bool(data.get("featured", False)),
        "readTime":  data.get("readTime", "5 min read"),
        "tags":      data.get("tags", [symbol, name, sector]),
    }

    return article


# ─────────────────────────────────────────────────────────────
# STEP 3 — Save articles to articles.json
# ─────────────────────────────────────────────────────────────

def load_articles() -> list[dict]:
    if ARTICLES_FILE.exists():
        with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_articles(articles: list[dict]) -> None:
    # Re-assign IDs so they're always sequential
    for i, a in enumerate(articles, 1):
        a["id"] = i
    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)


def already_covered(existing: list[dict], symbol: str, title: str) -> bool:
    """Return True if a very similar article already exists."""
    title_words = set(title.lower().split())
    for a in existing:
        tickers = [t["symbol"] for t in a.get("tickers", [])]
        if symbol in tickers:
            existing_words = set(a["title"].lower().split())
            overlap = len(title_words & existing_words) / max(len(title_words), 1)
            if overlap > 0.6:
                return True
    return False


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate AI stock articles")
    parser.add_argument("tickers", nargs="*", help="Ticker symbols (default: all in tickers.json)")
    parser.add_argument("--max", type=int, default=0, help="Max articles to generate (0 = unlimited)")
    args = parser.parse_args()

    # ── Validate API keys ──
    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set. Add it to your .env file.")
        sys.exit(1)
    if not FINNHUB_API_KEY:
        print("ERROR: FINNHUB_API_KEY not set. Add it to your .env file.")
        sys.exit(1)

    # ── Load ticker list ──
    if args.tickers:
        # User passed specific tickers on the command line
        ticker_list = [{"symbol": s.upper(), "exchange": "NASDAQ"} for s in args.tickers]
        # Try to enrich from tickers.json if available
        if TICKERS_FILE.exists():
            with open(TICKERS_FILE, "r") as f:
                saved = {t["symbol"]: t for t in json.load(f)}
            ticker_list = [saved.get(t["symbol"], t) for t in ticker_list]
    else:
        if not TICKERS_FILE.exists():
            print(f"ERROR: {TICKERS_FILE} not found. Run the script with ticker symbols as arguments.")
            sys.exit(1)
        with open(TICKERS_FILE, "r") as f:
            ticker_list = json.load(f)

    print(f"\n🤖  Alpha Stocks Insight — Article Generator")
    print(f"    Tickers: {', '.join(t['symbol'] for t in ticker_list)}")
    print(f"    Date:    {datetime.date.today()}\n")

    existing  = load_articles()
    new_count = 0

    for ticker in ticker_list:
        symbol = ticker["symbol"]

        if args.max and new_count >= args.max:
            print(f"\n✅  Reached max ({args.max}) articles. Stopping.")
            break

        print(f"── {symbol} {'─' * (40 - len(symbol))}")

        # Fetch news
        print(f"   Fetching news…")
        news = fetch_news(symbol)
        if not news:
            print(f"   No recent news found. Skipping.")
            continue
        print(f"   Found {len(news)} news item(s).")

        # Generate article
        print(f"   Generating article with Claude…")
        article = generate_article(ticker, news)
        if not article:
            continue

        # Deduplication check
        if already_covered(existing, symbol, article["title"]):
            print(f"   ⚠  Similar article already exists. Skipping.")
            continue

        # Prepend so newest articles appear first
        existing.insert(0, article)
        new_count += 1
        print(f"   ✓  \"{article['title']}\"")

        # Polite delay between API calls
        if ticker != ticker_list[-1]:
            time.sleep(2)

    if new_count == 0:
        print("\nNo new articles were added (no new news or all duplicates).")
    else:
        save_articles(existing)
        print(f"\n✅  {new_count} new article(s) added to data/articles.json")
        print(f"\nNext step — publish to your site:")
        print(f'   git add . && git commit -m "Add {new_count} AI-generated articles" && git push\n')


if __name__ == "__main__":
    main()
