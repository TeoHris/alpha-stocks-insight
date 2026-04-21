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

AUTHOR_NAME = "Alpha Stocks Insight Staff"
AUTHOR_BIO  = "Independent stock news and analysis covering NASDAQ and NYSE markets."


# ─────────────────────────────────────────────────────────────
# STEP 1 — Fetch market data from Finnhub
# ─────────────────────────────────────────────────────────────

def finnhub_get(endpoint: str, params: dict) -> dict | list | None:
    """Generic Finnhub API call. Returns parsed JSON or None on error."""
    params["token"] = FINNHUB_API_KEY
    try:
        resp = requests.get(f"https://finnhub.io/api/v1{endpoint}", params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def fetch_market_data(symbol: str) -> dict:
    """
    Fetch all market data for a symbol in one place:
      - Recent news headlines
      - Current quote (price, change)
      - Analyst price targets
      - Analyst buy/hold/sell recommendations
    Returns a single dict with all data (missing fields left as None).
    """
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=NEWS_LOOKBACK_DAYS)

    # ── News ──────────────────────────────────────────────────
    news_raw = finnhub_get("/company-news", {"symbol": symbol, "from": start.isoformat(), "to": end.isoformat()})
    news = [i for i in (news_raw or []) if i.get("headline") and i.get("summary")][:5]

    # ── Current quote ─────────────────────────────────────────
    quote = finnhub_get("/quote", {"symbol": symbol}) or {}

    # ── Analyst price targets ─────────────────────────────────
    targets = finnhub_get("/stock/price-target", {"symbol": symbol}) or {}

    # ── Analyst recommendations (last 2 months) ───────────────
    recs_raw = finnhub_get("/stock/recommendation", {"symbol": symbol}) or []
    recs = recs_raw[:2] if recs_raw else []

    return {
        "news":    news,
        "quote":   quote,
        "targets": targets,
        "recs":    recs,
    }


# ─────────────────────────────────────────────────────────────
# STEP 2 — Generate the article with Claude
# ─────────────────────────────────────────────────────────────

def generate_article(ticker: dict, market_data: dict) -> dict | None:
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

    news_items = market_data["news"]
    quote      = market_data["quote"]
    targets    = market_data["targets"]
    recs       = market_data["recs"]

    # ── Format news ───────────────────────────────────────────
    news_text = ""
    for i, item in enumerate(news_items, 1):
        news_text += f"\n{i}. HEADLINE: {item['headline']}\n"
        if item.get("summary"):
            news_text += f"   SUMMARY: {item['summary'][:400]}\n"
        if item.get("source"):
            news_text += f"   SOURCE: {item['source']}\n"

    # ── Format quote ──────────────────────────────────────────
    price_text = "Not available."
    if quote.get("c"):
        chg_abs = quote.get("d", 0)
        chg_pct = quote.get("dp", 0)
        direction = "▲" if chg_abs >= 0 else "▼"
        price_text = (
            f"Current price: ${quote['c']:.2f} "
            f"({direction} ${abs(chg_abs):.2f} / {abs(chg_pct):.2f}% today). "
            f"52-week range: ${quote.get('l', 'N/A')} – ${quote.get('h', 'N/A')}."
        )

    # ── Format analyst targets ────────────────────────────────
    target_text = "Not available."
    if targets.get("targetMean"):
        target_text = (
            f"Wall Street consensus price target: ${targets['targetMean']:.2f} "
            f"(high: ${targets.get('targetHigh', 'N/A')}, low: ${targets.get('targetLow', 'N/A')}). "
            f"Based on {targets.get('numberOfAnalysts', 'N/A')} analyst estimates."
        )
        if targets.get("targetMedian"):
            target_text += f" Median target: ${targets['targetMedian']:.2f}."

    # ── Format analyst recommendations ────────────────────────
    rec_text = "Not available."
    if recs:
        r = recs[0]
        rec_text = (
            f"Latest consensus ({r.get('period', 'recent')}): "
            f"Strong Buy: {r.get('strongBuy', 0)}, Buy: {r.get('buy', 0)}, "
            f"Hold: {r.get('hold', 0)}, Sell: {r.get('sell', 0)}, "
            f"Strong Sell: {r.get('strongSell', 0)}."
        )
        if len(recs) > 1:
            r2 = recs[1]
            rec_text += (
                f" Prior period ({r2.get('period', '')}): "
                f"Strong Buy: {r2.get('strongBuy', 0)}, Buy: {r2.get('buy', 0)}, "
                f"Hold: {r2.get('hold', 0)}."
            )

    today    = datetime.date.today()
    date_str = today.strftime("%B %d, %Y").replace(" 0", " ")

    # ══════════════════════════════════════════════════════════
    # EDITORIAL PROMPT — edit below to change article style
    # ══════════════════════════════════════════════════════════
    prompt = f"""You are a staff writer for Alpha Stocks Insight, a US stock news website.

Write a factual, direct news article about {name} ({exchange}:{symbol}), a {sector} company.

━━ MARKET DATA (use all figures provided — do not invent numbers) ━━

CURRENT PRICE & PERFORMANCE:
{price_text}

RECENT NEWS:
{news_text}

WALL STREET ANALYST DATA:
Price targets: {target_text}
Recommendations: {rec_text}

━━ EDITORIAL GUIDELINES (follow strictly) ━━

TONE & STYLE:
- Write directly and concisely. No hype, no filler phrases.
- Do not use words like: "soaring", "surging", "skyrocketing", "explosive", "massive", "game-changer", "revolutionary", "stunning".
- Use plain, precise language. State facts. Let numbers speak.
- Attribute claims to sources (e.g. "according to the company", "analysts at Goldman Sachs note").

REQUIRED SECTIONS (use these exact ## headings):
1. ## Recent Developments
   Summarise the key news factually. Include specific figures, dates, and company statements from the news items above.

2. ## Financial Snapshot
   Include the current stock price and today's change. Reference any relevant financial results or metrics mentioned in the news. Keep it factual and brief.

3. ## Wall Street View
   Summarise the analyst consensus price target and any recent changes. Report the buy/hold/sell breakdown from the recommendation data above. If a target was raised or cut, say so explicitly.

4. ## Technical Picture
   Write a short technical analysis paragraph. Reference the current price vs. the 52-week range. Include observations on support/resistance levels, and note MACD and RSI conditions if you can infer them from price momentum. Be specific — avoid vague statements.

5. ### Key Takeaways
   3–4 bullet points summarising the most important facts from the article.

FORMATTING:
- Total length: 450–600 words
- Do NOT restate the title at the top of the content
- Do NOT add a disclaimer — the site adds one automatically
- Use **bold** only for numbers and company names, not for emphasis

━━ OUTPUT FORMAT ━━

Return ONLY this JSON object (no markdown fences, no explanation):
{{
  "title": "<factual headline with ticker symbol, max 90 characters>",
  "teaser": "<2 concise sentences summarising the article, max 180 characters>",
  "category": "<one of: Stock Analysis | Earnings Preview | AI & Technology | Semiconductors | Cloud Computing | Big Tech | AI Infrastructure | Technology>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "featured": false,
  "readTime": "<X min read>",
  "content": "<full article in Markdown>"
}}"""

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

        # Fetch all market data
        print(f"   Fetching market data…")
        market_data = fetch_market_data(symbol)
        if not market_data["news"]:
            print(f"   No recent news found. Skipping.")
            continue
        print(f"   Found {len(market_data['news'])} news item(s). Price: ${market_data['quote'].get('c', 'N/A')}")

        # Generate article
        print(f"   Generating article with Claude…")
        article = generate_article(ticker, market_data)
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
