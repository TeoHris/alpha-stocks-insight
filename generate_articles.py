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
import csv
import time
import datetime
import re
import argparse
import requests
from pathlib import Path

# ── Optional enrichment libraries ────────────────────────────
try:
    import yfinance as yf
    import pandas as pd
    _YF_AVAILABLE = True
except ImportError:
    _YF_AVAILABLE = False

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
TICKERS_CSV   = SCRIPT_DIR / "data" / "us_stocks_formatted_comprehensive.csv"


def load_tickers() -> list[dict]:
    """Load tickers from CSV if available, otherwise fall back to tickers.json."""
    if TICKERS_CSV.exists():
        tickers = []
        with open(TICKERS_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("symbol"):
                    tickers.append({
                        "symbol":   row["symbol"].strip().upper(),
                        "exchange": row.get("exchange", "NASDAQ").strip(),
                        "name":     row.get("name", "").strip(),
                        "sector":   row.get("sector", "").strip(),
                    })
        return tickers
    elif TICKERS_FILE.exists():
        with open(TICKERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        return []

# S&P sector name (from CSV) → filter chip name used on the site
SECTOR_TO_CHIP = {
    "Information Technology": "Technology",
    "Health Care":            "Health Care",
    "Financials":             "Financials",
    "Industrials":            "Industrials",
    "Consumer Discretionary": "Consumer",
    "Consumer Staples":       "Consumer",
    "Energy":                 "Energy",
    "Real Estate":            "Real Estate",
    "Communication Services": "Communication Services",
    "Materials":              "Materials",
    "Utilities":              "Utilities",
}

def build_sectors(primary_category: str, ticker_sector: str) -> list[str]:
    """Return the full list of sector chips this article belongs to."""
    sectors = {primary_category}
    chip = SECTOR_TO_CHIP.get(ticker_sector)
    if chip:
        sectors.add(chip)
    return sorted(sectors)

# How many days of news to look back
NEWS_LOOKBACK_DAYS = 3

# Categories to rotate through
CATEGORIES = [
    "Stock Analysis",
    "Earnings Report",
    "Technology",
    "Health Care",
    "Financials",
    "Industrials",
    "Consumer",
    "Energy",
    "Real Estate",
    "Communication Services",
    "Materials",
]

AUTHOR_NAME = "Alpha Stocks Insight Staff"
AUTHOR_BIO  = "Independent stock news and analysis covering NASDAQ and NYSE markets."

# ── Model config ──────────────────────────────────────────────
MODEL_PREMIUM   = "claude-sonnet-4-6"          # premium full articles
MODEL_QUICK_HIT = "claude-haiku-4-5-20251001"  # quick hits (batched)
MODEL_ROUNDUP   = "claude-haiku-4-5-20251001"  # daily roundup

# Pricing per million tokens (input / output)
PRICING = {
    MODEL_PREMIUM:   (3.00,  15.00),
    MODEL_QUICK_HIT: (0.80,   4.00),
    MODEL_ROUNDUP:   (0.80,   4.00),
}

# Score threshold: at or above this → premium article; below → quick hit
# Earnings tickers always score 999 (always Sonnet).
# A big price move alone = 5pts. Price move + several keywords = ~15pts.
# Set to 20 so only earnings + high-signal tickers use Sonnet; the rest use Haiku.
PREMIUM_SCORE_THRESHOLD = 20

# Hard cap: never use Sonnet for more than this many articles per run.
# This keeps costs predictable even during volatile/earnings-heavy days.
MAX_PREMIUM_ARTICLES = 5

# Cost tracker (updated as articles are generated)
_cost_usd     = 0.0
_tokens_in    = 0
_tokens_out   = 0

def track_usage(model: str, input_tokens: int, output_tokens: int) -> None:
    global _cost_usd, _tokens_in, _tokens_out
    price_in, price_out = PRICING.get(model, (3.00, 15.00))
    _cost_usd  += (input_tokens * price_in + output_tokens * price_out) / 1_000_000
    _tokens_in  += input_tokens
    _tokens_out += output_tokens


# ─────────────────────────────────────────────────────────────
# SEC EDGAR helpers
# ─────────────────────────────────────────────────────────────

EDGAR_HEADERS = {"User-Agent": "AlphaStocksInsight bot@alphastocksinsight.com"}

# 8-K item codes → human-readable event type
EDGAR_ITEM_LABELS = {
    "1.01": "Material Definitive Agreement (deal/contract)",
    "1.02": "Termination of Material Agreement",
    "2.01": "Completion of Acquisition or Disposition",
    "2.02": "Results of Operations (earnings release)",
    "2.05": "Departure of Named Executive Officers",
    "2.06": "Material Impairment",
    "5.02": "Departure or Appointment of Directors/Officers",
    "5.03": "Amendment to Articles of Incorporation",
    "7.01": "Regulation FD Disclosure",
    "8.01": "Other Material Events",
}

_cik_cache: dict = {}   # symbol → zero-padded CIK string, loaded once on first use

def _load_cik_cache() -> None:
    """Fetch the SEC master ticker→CIK table (one network call, cached for the run)."""
    global _cik_cache
    if _cik_cache:
        return
    try:
        resp = requests.get(
            "https://www.sec.gov/files/company_tickers.json",
            headers=EDGAR_HEADERS, timeout=15,
        )
        data = resp.json()
        _cik_cache = {
            v["ticker"].upper(): str(v["cik_str"]).zfill(10)
            for v in data.values()
        }
    except Exception:
        _cik_cache = {}


def fetch_edgar_8k(symbol: str) -> list[dict]:
    """
    Return recent 8-K filings (last 10 days) for a symbol from SEC EDGAR.
    Each entry: { date, items: [code, ...], labels: ["human label", ...] }
    """
    _load_cik_cache()
    cik = _cik_cache.get(symbol.upper())
    if not cik:
        return []

    try:
        resp = requests.get(
            f"https://data.sec.gov/submissions/CIK{cik}.json",
            headers=EDGAR_HEADERS, timeout=15,
        )
        filings  = resp.json().get("filings", {}).get("recent", {})
        forms    = filings.get("form", [])
        dates    = filings.get("filingDate", [])
        items    = filings.get("items", [])

        cutoff  = (datetime.date.today() - datetime.timedelta(days=10)).isoformat()
        results = []
        for i, form in enumerate(forms):
            if form != "8-K":
                continue
            date = dates[i] if i < len(dates) else ""
            if date < cutoff:
                break   # newest-first — safe to stop
            codes  = [c.strip() for c in (items[i] if i < len(items) else "").split(",") if c.strip()]
            labels = [EDGAR_ITEM_LABELS.get(c, f"Item {c}") for c in codes]
            results.append({"date": date, "items": codes, "labels": labels})

        return results[:5]
    except Exception:
        return []


# ─────────────────────────────────────────────────────────────
# yfinance helpers
# ─────────────────────────────────────────────────────────────

def fetch_yfinance_data(symbol: str) -> dict:
    """
    Fetch supplementary data via yfinance:
      - Last 4 quarters of EPS (actual vs estimate, surprise %)
      - Key valuation & profitability ratios
    Returns empty dicts gracefully if yfinance is unavailable.
    """
    result: dict = {"earnings_surprise": [], "ratios": {}}
    if not _YF_AVAILABLE:
        return result

    try:
        t = yf.Ticker(symbol)

        # ── Earnings surprise history ──────────────────────────
        try:
            ed = t.earnings_dates
            if ed is not None and not ed.empty:
                for idx, row in ed.head(4).iterrows():
                    actual   = row.get("Reported EPS")
                    estimate = row.get("EPS Estimate")
                    surprise = row.get("Surprise(%)")
                    if actual is not None and not pd.isna(actual):
                        result["earnings_surprise"].append({
                            "date":        str(idx.date()),
                            "epsActual":   round(float(actual),   2),
                            "epsEstimate": round(float(estimate), 2) if estimate is not None and not pd.isna(estimate) else None,
                            "surprisePct": round(float(surprise), 1) if surprise  is not None and not pd.isna(surprise)  else None,
                        })
        except Exception:
            pass

        # ── Key ratios ─────────────────────────────────────────
        try:
            info = t.info
            def _safe(k):
                v = info.get(k)
                if v is None:
                    return None
                if isinstance(v, float) and (v != v):   # NaN check
                    return None
                return round(v, 4) if isinstance(v, float) else v

            for key in ["marketCap", "trailingPE", "forwardPE",
                        "profitMargins", "revenueGrowth", "earningsGrowth",
                        "grossMargins", "operatingMargins"]:
                val = _safe(key)
                if val is not None:
                    result["ratios"][key] = val
        except Exception:
            pass

    except Exception:
        pass

    return result


# ─────────────────────────────────────────────────────────────
# STEP 1 — Fetch market data from Finnhub
# ─────────────────────────────────────────────────────────────

def finnhub_get(endpoint: str, params: dict, retries: int = 2) -> dict | list | None:
    """Generic Finnhub API call with retry on rate-limit (429) or timeout."""
    params["token"] = FINNHUB_API_KEY
    for attempt in range(retries + 1):
        try:
            resp = requests.get(f"https://finnhub.io/api/v1{endpoint}", params=params, timeout=15)
            if resp.status_code == 429:
                # Rate limited — wait and retry
                wait = 2 * (attempt + 1)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.Timeout:
            if attempt < retries:
                time.sleep(2)
            continue
        except Exception:
            return None
    return None


def fetch_market_data(symbol: str) -> dict:
    """
    Fetch all market data for a symbol:
      - Recent news headlines
      - Current quote (price, daily change)
      - 52-week high/low from stock metrics
      - 20/50/200-day moving averages (calculated from daily candles)
      - Analyst price targets
      - Analyst buy/hold/sell recommendations
    Returns a single dict with all data.
    """
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=NEWS_LOOKBACK_DAYS)

    # ── News ──────────────────────────────────────────────────
    news_raw = finnhub_get("/company-news", {"symbol": symbol, "from": start.isoformat(), "to": end.isoformat()})
    news = [i for i in (news_raw or []) if i.get("headline") and i.get("summary")][:5]
    time.sleep(0.5)

    # ── Current quote (c=price, d=change, dp=% change, pc=prev close)
    quote = finnhub_get("/quote", {"symbol": symbol}) or {}
    time.sleep(0.5)

    # ── 52-week high/low from basic financials ─────────────────
    # NOTE: quote fields 'h' and 'l' are the DAY's range, not 52-week.
    # The correct 52-week data comes from the metrics endpoint.
    metrics_raw = finnhub_get("/stock/metric", {"symbol": symbol, "metric": "all"}) or {}
    metrics     = metrics_raw.get("metric", {})
    week52_high = metrics.get("52WeekHigh")
    week52_low  = metrics.get("52WeekLow")
    time.sleep(0.5)

    # ── Moving averages (calculated from daily candles) ────────
    # Fetch 310 calendar days (~220 trading days) to compute 20/50/200 MAs
    ma_data = {"ma20": None, "ma50": None, "ma200": None}
    candle_end   = int(datetime.datetime.now().timestamp())
    candle_start = int((datetime.datetime.now() - datetime.timedelta(days=310)).timestamp())
    candles = finnhub_get("/stock/candle", {
        "symbol":     symbol,
        "resolution": "D",
        "from":       candle_start,
        "to":         candle_end,
    }) or {}

    closes = candles.get("c", [])  # list of closing prices, oldest first
    if len(closes) >= 20:
        ma_data["ma20"]  = round(sum(closes[-20:])  / 20,  2)
    if len(closes) >= 50:
        ma_data["ma50"]  = round(sum(closes[-50:])  / 50,  2)
    if len(closes) >= 200:
        ma_data["ma200"] = round(sum(closes[-200:]) / 200, 2)
    time.sleep(0.5)

    # ── Analyst price targets ─────────────────────────────────
    targets = finnhub_get("/stock/price-target", {"symbol": symbol}) or {}
    time.sleep(0.5)

    # ── Analyst recommendations (last 2 months) ───────────────
    recs_raw = finnhub_get("/stock/recommendation", {"symbol": symbol}) or []
    recs = recs_raw[:2] if recs_raw else []

    # ── yfinance: earnings surprise + key ratios ──────────────
    yf_data = fetch_yfinance_data(symbol)
    time.sleep(0.3)

    # ── SEC EDGAR: recent 8-K filings ─────────────────────────
    edgar_8k = fetch_edgar_8k(symbol)
    time.sleep(0.3)

    return {
        "news":             news,
        "quote":            quote,
        "week52_high":      week52_high,
        "week52_low":       week52_low,
        "ma_data":          ma_data,
        "targets":          targets,
        "recs":             recs,
        "yf_earnings":      yf_data["earnings_surprise"],
        "yf_ratios":        yf_data["ratios"],
        "edgar_8k":         edgar_8k,
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

    news_items   = market_data["news"]
    quote        = market_data["quote"]
    targets      = market_data["targets"]
    recs         = market_data["recs"]
    ma_data      = market_data["ma_data"]
    week52_high  = market_data["week52_high"]
    week52_low   = market_data["week52_low"]
    yf_earnings  = market_data.get("yf_earnings", [])
    yf_ratios    = market_data.get("yf_ratios", {})
    edgar_8k     = market_data.get("edgar_8k", [])

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
        chg_abs   = quote.get("d", 0)
        chg_pct   = quote.get("dp", 0)
        direction = "▲" if chg_abs >= 0 else "▼"
        price_text = (
            f"Current price: ${quote['c']:.2f} "
            f"({direction} ${abs(chg_abs):.2f} / {abs(chg_pct):.2f}% today). "
            f"Previous close: ${quote.get('pc', 'N/A')}."
        )
        if week52_high and week52_low:
            price_text += f" 52-week range: ${week52_low:.2f} – ${week52_high:.2f}."

    # ── Format moving averages ────────────────────────────────
    ma_text = "Moving average data not available."
    if any(v is not None for v in ma_data.values()):
        current = quote.get("c")
        parts = []
        for label, val in [("20-day MA", ma_data["ma20"]),
                            ("50-day MA", ma_data["ma50"]),
                            ("200-day MA", ma_data["ma200"])]:
            if val is not None:
                if current:
                    rel = "above" if current > val else "below"
                    parts.append(f"{label}: ${val:.2f} (price is {rel})")
                else:
                    parts.append(f"{label}: ${val:.2f}")
        ma_text = ". ".join(parts) + "."

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

    # ── Format yfinance earnings surprise ────────────────────
    earnings_text = "Not available."
    if yf_earnings:
        lines = []
        for e in yf_earnings[:4]:
            surprise_str = ""
            if e.get("surprisePct") is not None:
                sign = "+" if e["surprisePct"] >= 0 else ""
                surprise_str = f" ({sign}{e['surprisePct']}% surprise)"
            est_str = f", estimate ${e['epsEstimate']}" if e.get("epsEstimate") else ""
            lines.append(f"  {e['date']}: EPS ${e['epsActual']}{est_str}{surprise_str}")
        earnings_text = "\n".join(lines)

    # ── Format yfinance key ratios ────────────────────────────
    ratios_text = "Not available."
    if yf_ratios:
        parts = []
        if yf_ratios.get("marketCap"):
            mc = yf_ratios["marketCap"]
            mc_str = f"${mc/1e12:.2f}T" if mc >= 1e12 else f"${mc/1e9:.1f}B"
            parts.append(f"Market cap: {mc_str}")
        if yf_ratios.get("trailingPE"):
            parts.append(f"Trailing P/E: {yf_ratios['trailingPE']:.1f}x")
        if yf_ratios.get("forwardPE"):
            parts.append(f"Forward P/E: {yf_ratios['forwardPE']:.1f}x")
        if yf_ratios.get("profitMargins"):
            parts.append(f"Net margin: {yf_ratios['profitMargins']*100:.1f}%")
        if yf_ratios.get("revenueGrowth"):
            parts.append(f"Revenue growth (YoY): {yf_ratios['revenueGrowth']*100:.1f}%")
        if yf_ratios.get("earningsGrowth"):
            parts.append(f"Earnings growth (YoY): {yf_ratios['earningsGrowth']*100:.1f}%")
        if yf_ratios.get("grossMargins"):
            parts.append(f"Gross margin: {yf_ratios['grossMargins']*100:.1f}%")
        if yf_ratios.get("operatingMargins"):
            parts.append(f"Operating margin: {yf_ratios['operatingMargins']*100:.1f}%")
        ratios_text = " | ".join(parts) if parts else "Not available."

    # ── Format SEC EDGAR 8-K filings ─────────────────────────
    edgar_text = "No recent 8-K filings."
    if edgar_8k:
        lines = []
        for f in edgar_8k:
            labels = ", ".join(f["labels"]) or "Item " + ", ".join(f["items"])
            lines.append(f"  {f['date']}: {labels}")
        edgar_text = "\n".join(lines)

    today    = datetime.date.today()
    date_str = today.strftime("%B %d, %Y").replace(" 0", " ")

    # ══════════════════════════════════════════════════════════
    # EDITORIAL PROMPT — edit below to change article style
    # ══════════════════════════════════════════════════════════
    prompt = f"""You are writing in "Factual + Engaging" mode for alphastocksinsight.com.
Your tone is professional and calm — like a senior analyst writing a client note.

Write an article about {name} ({exchange}:{symbol}), a {sector} company.

━━ MARKET DATA (use only figures provided below — do not invent or estimate any numbers) ━━

CURRENT PRICE & PERFORMANCE:
{price_text}

MOVING AVERAGES (calculated from actual price history):
{ma_text}

RECENT NEWS:
{news_text}

SEC EDGAR — RECENT 8-K FILINGS (official company disclosures):
{edgar_text}

EARNINGS HISTORY (last 4 quarters, from SEC filings via yfinance):
{earnings_text}

COMPANY FUNDAMENTALS (yfinance):
{ratios_text}

WALL STREET ANALYST DATA:
Price targets: {target_text}
Recommendations: {rec_text}

━━ RULES (follow every one strictly) ━━

FACTUAL INTEGRITY:
- Write ONLY about events that have already occurred and been reported in the data above.
- Do NOT write previews or speculation about upcoming events.
- For earnings articles: use the EPS actual/estimate/surprise from the Earnings History section
  alongside any revenue or guidance figures from the news. Cross-reference both sources.
- Use SEC EDGAR 8-K filings to confirm the event type (e.g. Item 2.02 = earnings release,
  Item 5.02 = management change, Item 2.01 = acquisition). Reference the filing date if relevant.
- Use Company Fundamentals (P/E, margins, growth) to add valuation and profitability context
  in the Financial Snapshot or What Drove the Results section — but only if the numbers are present.
- Never invent, estimate, or extrapolate numbers not present in the data above.
- If there is no concrete event to report (no results, no announcement, no material news), return "NO_STORY" in the title field.

FINANCIAL PRECISION — mandatory:
- Never write "earnings" as a standalone noun. Always specify the exact metric:
  EPS (earnings per share), net income, operating income, EBIT, EBITDA, or gross profit.
  ✗ "earnings beat" → ✓ "EPS of $1.42 beat the $1.31 consensus"
  ✗ "earnings growth" → ✓ "net income grew 18% year-over-year to $2.1B"
  ✗ "earnings acceleration" → ✓ "operating income expanded 220 bps to $890M"
- Same rule applies to "revenue" — always include the actual figure and YoY change if available.
- If the specific metric is not in the data provided, omit the claim entirely.

BANNED WORDS — never use:
"soaring", "surging", "skyrocketing", "explosive", "massive", "game-changer",
"revolutionary", "stunning", "blockbuster", "crushing it", "blowout", "monster"

STRUCTURE — follow this exact flow, in this order:

1. OPENING PARAGRAPH (2–3 sentences, no heading):
   Lead with the single most important fact and the stock's reaction. Follow immediately with
   what drove it. No throat-clearing ("In a release today…", "The company announced…").

3. ## [Contextual heading — e.g. "Q1 2026 At a Glance", "Deal Terms", "Key Metrics"]
   Bullet points only. Each bullet: one fact, one number. Never repeat a number used elsewhere.

4. ## What Drove the Results  (or a contextually fitting heading)
   1–2 short paragraphs on the "why" — cost management, strategic rationale, historical context.
   Attribute claims to sources. Max 2–4 sentences per paragraph.

5. ## Wall Street View
   One short paragraph on analyst consensus. Note any month-over-month shift in ratings.
   OMIT this section entirely if both price target and recommendation data are "Not available".

6. ## Technical Picture
   One short paragraph on price vs. 20-, 50-, 200-day MAs and what that implies for trend.
   Do NOT invent RSI or MACD values.
   OMIT this section entirely if moving average data is "Not available".

7. ## Investor Takeaway  (always last, always a paragraph — NOT bullets)
   2–3 sentences. Ground everything in company statements or reported analyst views only.
   No speculation. No price targets unless explicitly provided in the data above.

TRANSITIONS:
- Each section should flow naturally from the previous one.
- Avoid abrupt topic jumps. One bridging sentence between sections where needed.

FORMATTING RULES:
- Total length: 400–550 words
- Paragraphs: 2–4 sentences maximum
- Bold: numbers and company/ticker names only — never bold for emphasis
- Ticker format: always (NYSE: SYMBOL) or (NASDAQ: SYMBOL) with a space after the colon
- Do NOT restate the article title anywhere in the content
- Do NOT include any disclaimer — the site template adds it automatically

━━ OUTPUT FORMAT ━━

Return ONLY this JSON object (no markdown fences, no explanation):
{{
  "title": "<factual headline with ticker symbol, max 90 characters — use NO_STORY if there is nothing to report>",
  "teaser": "<2 concise sentences summarising the article, max 180 characters>",
  "category": "<one of: Stock Analysis | Earnings Report | Technology | Health Care | Financials | Industrials | Consumer | Energy | Real Estate | Communication Services | Materials>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "featured": false,
  "readTime": "<X min read>",
  "content": "<full article in Markdown>"
}}"""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    try:
        message = client.messages.create(
            model=MODEL_PREMIUM,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        track_usage(MODEL_PREMIUM, message.usage.input_tokens, message.usage.output_tokens)
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

    # If Claude signals there's no real story, discard silently
    if data.get("title", "").startswith("NO_STORY"):
        print(f"   ⚠  {symbol}: no concrete story to report — skipped.")
        return None

    # Build the full article record
    slug = f"{symbol.lower()}-{re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')[:60]}"
    now  = datetime.datetime.now()

    primary_category = data.get("category", "Stock Analysis")
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
        "category":  primary_category,
        "sectors":   build_sectors(primary_category, sector),
        "featured":  bool(data.get("featured", False)),
        "readTime":  data.get("readTime", "5 min read"),
        "tags":      data.get("tags", [symbol, name, sector]),
    }

    return article


# ─────────────────────────────────────────────────────────────
# Quick-hit batch generator (Haiku — 5 articles per API call)
# ─────────────────────────────────────────────────────────────

def generate_quick_hits_batch(batch: list[dict]) -> list[dict]:
    """
    Generate 300–400 word quick-hit articles for a batch of tickers
    in a single Haiku API call. Returns a list of article dicts.
    """
    try:
        import anthropic
    except ImportError:
        print("ERROR: 'anthropic' not installed.")
        return []

    today    = datetime.date.today()
    date_str = today.strftime("%B %d, %Y").replace(" 0", " ")
    now      = datetime.datetime.now()

    # Build a rich brief for each ticker in the batch
    briefs = ""
    for i, item in enumerate(batch, 1):
        t      = item["ticker"]
        mdata  = item["market_data"]
        symbol = t["symbol"]
        name   = t.get("name", symbol)
        quote  = mdata["quote"]
        news   = mdata["news"][:5]

        price_str = f"${quote['c']:.2f} ({quote.get('dp', 0):+.2f}%)" if quote.get("c") else "N/A"
        prev_close = f"${quote.get('pc', 'N/A')}"
        week52 = ""
        metrics = mdata.get("metrics", {})
        if metrics.get("52WeekHigh") and metrics.get("52WeekLow"):
            week52 = f"52-wk range: ${metrics['52WeekLow']:.2f}–${metrics['52WeekHigh']:.2f}"

        headlines = "\n   ".join(
            f"- {n['headline']} ({n.get('source','')})" for n in news
        ) if news else "No recent news"

        targets = mdata.get("price_targets", {})
        target_str = f"Consensus target: ${targets['targetMean']:.2f} ({targets.get('numberOfAnalysts','?')} analysts)" if targets.get("targetMean") else ""

        edgar = mdata.get("edgar_8k", [])
        edgar_str = "; ".join(e.get("title","") for e in edgar[:2]) if edgar else ""

        yf_earnings = mdata.get("yf_earnings", "")
        # yf_ratios may be a dict or a string — normalise to string
        yf_ratios_raw = mdata.get("yf_ratios", "")
        if isinstance(yf_ratios_raw, dict):
            yf_ratios = "; ".join(f"{k}: {v}" for k, v in yf_ratios_raw.items() if v)
        else:
            yf_ratios = str(yf_ratios_raw) if yf_ratios_raw else ""

        briefs += f"""
{i}. {symbol} ({name})
   Price: {price_str} | Prev close: {prev_close} | {week52}
   {target_str}
   Recent news:
   {headlines}
   {"SEC 8-K filings: " + edgar_str if edgar_str else ""}
   {"Earnings history: " + yf_earnings if yf_earnings else ""}
   {"Key ratios: " + yf_ratios if yf_ratios else ""}
"""

    prompt = f"""You are a financial news writer producing articles for Alpha Stocks Insight.

Write ONE article (400–600 words) for EACH of the {len(batch)} stocks below.

━━ STRUCTURE (mandatory for every article) ━━

1. TITLE: "Company Name (EXCHANGE: TICKER) [Verb] [Key Event]"
   Example: "UnitedHealth (NYSE: UNH) Beats Q1 Estimates as Premiums Offset Rising Medical Costs"

2. OPENING HOOK (1 paragraph):
   Lead with the stock's price move and the single most important fact. Include a direct quote from management or analyst if one appears in the news.

4. KEY METRICS section (use heading "## Q[X] 20XX At a Glance" for earnings, or "## By the Numbers" for other events):
   - 3–4 bullet points with REAL numbers from the data provided (revenue, EPS, guidance, % beat, price target, etc.)
   - If a number is not in the data, omit that bullet — do NOT invent figures.

5. WHAT DROVE IT (1–2 short paragraphs, heading "## What Drove the Results" or contextually fitting):
   Explain the WHY with specifics. Attribute to sources. No vague statements.

6. WALL STREET VIEW (1 paragraph, heading "## Wall Street View"):
   Analyst consensus, price target, rating trend. Omit entirely if no analyst data is available.

7. INVESTOR TAKEAWAY (1 paragraph, heading "## Investor Takeaway"):
   Concise, useful. Grounded in facts from the data. No speculation.

━━ STRICT QUALITY RULES ━━
- FINANCIAL PRECISION — never write "earnings" as a standalone noun. Always specify the exact metric:
  EPS (earnings per share), net income, operating income, EBIT, EBITDA, or gross profit.
  ✗ "earnings beat" → ✓ "EPS of $1.42 beat the $1.31 consensus"
  ✗ "earnings growth" → ✓ "net income grew 18% year-over-year to $2.1B"
  ✗ "earnings acceleration" → ✓ "operating income expanded to $890M"
  If the specific figure is not in the data, omit the claim — do not guess.
- BANNED phrases: "navigates the shifting landscape", "measured optimism", "bright spot", "ongoing transformation", "resilience in core segments", "remains to be seen", "time will tell", "headwinds", "tailwinds" used vaguely, any other generic business-speak.
- Short, direct sentences. No repetition of the same idea.
- Do NOT add disclaimers (added automatically by the site).
- Do NOT restate the ticker symbol as the very first word of the content.
- If there is genuinely insufficient data for the full structure, write a shorter "Quick Hit" (200–300 words) with just the hook and key facts — do NOT pad with filler.

━━ STOCKS ━━
{briefs}

Return ONLY a valid JSON array with exactly {len(batch)} objects:
[
  {{
    "symbol": "TICKER",
    "title": "Headline per format above, max 100 chars",
    "teaser": "One sharp sentence summary, max 140 chars",
    "category": "<choose ONE: Earnings Report | Stock Analysis | Technology | Health Care | Financials | Industrials | Consumer | Energy | Real Estate | Communication Services | Materials — use 'Earnings Report' if the article is about quarterly/annual results, otherwise pick the most relevant sector or 'Stock Analysis'>",
    "tags": ["tag1", "tag2", "tag3"],
    "readTime": "3 min read",
    "content": "Full markdown article, 400-600 words (or 200-300 word Quick Hit if data is thin)"
  }}
]"""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        message = client.messages.create(
            model=MODEL_QUICK_HIT,
            max_tokens=6000,
            messages=[{"role": "user", "content": prompt}],
        )
        track_usage(MODEL_QUICK_HIT, message.usage.input_tokens, message.usage.output_tokens)
        raw = message.content[0].text.strip()
    except Exception as e:
        print(f"  ✗  Haiku API error (batch): {e}")
        return []

    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    try:
        data_list = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  ✗  JSON parse error in quick-hit batch: {e}")
        return []

    articles = []
    for data in data_list:
        sym    = data.get("symbol", "").upper()
        ticker = next((item["ticker"] for item in batch if item["ticker"]["symbol"] == sym), batch[0]["ticker"])
        slug   = f"{sym.lower()}-{re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')[:60]}"
        primary_category = data.get("category", "Stock Analysis")
        ticker_sector    = ticker.get("sector", "")
        articles.append({
            "id":        None,
            "slug":      slug,
            "title":     data["title"],
            "author":    AUTHOR_NAME,
            "authorBio": AUTHOR_BIO,
            "date":      date_str,
            "time":      now.strftime("%I:%M %p ET").lstrip("0"),
            "dateISO":   now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "teaser":    data["teaser"],
            "content":   data["content"],
            "tickers":   [{"exchange": ticker.get("exchange", "NASDAQ"), "symbol": sym}],
            "category":  primary_category,
            "sectors":   build_sectors(primary_category, ticker_sector),
            "featured":  False,
            "readTime":  data.get("readTime", "2 min read"),
            "tags":      data.get("tags", [sym]),
        })
    return articles


# ─────────────────────────────────────────────────────────────
# Daily roundup generator (Haiku — covers top 5–8 tickers)
# ─────────────────────────────────────────────────────────────

def generate_roundup(top_items: list[dict]) -> dict | None:
    """
    Generate one 'Today's Top Stock Highlights' roundup article
    covering the 5–8 most newsworthy tickers of the day.
    Uses Haiku (cheap) in a single API call.
    """
    try:
        import anthropic
    except ImportError:
        return None

    today    = datetime.date.today()
    date_str = today.strftime("%B %d, %Y").replace(" 0", " ")
    now      = datetime.datetime.now()

    briefs = ""
    tickers_covered = []
    for item in top_items[:8]:
        t      = item["ticker"]
        mdata  = item["market_data"]
        symbol = t["symbol"]
        name   = t.get("name", symbol)
        quote  = mdata["quote"]
        news   = mdata["news"][:2]

        price_str = f"${quote['c']:.2f} ({quote.get('dp', 0):+.2f}%)" if quote.get("c") else "N/A"
        headlines = "; ".join(n["headline"] for n in news) if news else "No recent news"

        briefs += f"\n- **{symbol}** ({name}) — {price_str}: {headlines}"
        tickers_covered.append({"exchange": t.get("exchange", "NASDAQ"), "symbol": symbol})

    date_label = today.strftime("%B %d, %Y").replace(" 0", " ")

    prompt = f"""You are a financial news writer. Write a daily market roundup article for {date_label} covering the stocks listed below.

STOCKS TO COVER:
{briefs}

RULES:
- Title must be: "Today's Top Stock Highlights — {date_label}"
- One paragraph per stock (3–5 sentences each). State facts, include price move.
- End with a ### Key Takeaways section with one bullet per stock.
- Neutral, professional tone. No hype. No disclaimers (added automatically).
- Total length: 500–700 words.

Return ONLY this JSON (no markdown fences):
{{
  "title": "Today's Top Stock Highlights — {date_label}",
  "teaser": "A roundup of today's most significant stock moves and news across the market.",
  "content": "Full markdown roundup here"
}}"""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        message = client.messages.create(
            model=MODEL_ROUNDUP,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        track_usage(MODEL_ROUNDUP, message.usage.input_tokens, message.usage.output_tokens)
        raw = message.content[0].text.strip()
    except Exception as e:
        print(f"  ✗  Haiku roundup error: {e}")
        return None

    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None

    slug = f"roundup-{today.strftime('%Y-%m-%d')}"
    return {
        "id":        None,
        "slug":      slug,
        "title":     data["title"],
        "author":    AUTHOR_NAME,
        "authorBio": AUTHOR_BIO,
        "date":      date_str,
        "time":      now.strftime("%I:%M %p ET").lstrip("0"),
        "dateISO":   now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "teaser":    data["teaser"],
        "content":   data["content"],
        "tickers":   tickers_covered,
        "category":  "Stock Analysis",
        "featured":  False,
        "readTime":  "4 min read",
        "tags":      ["market roundup", "daily highlights", date_label],
    }


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
# STEP 3 — Refresh banner prices in data/quotes.json
# ─────────────────────────────────────────────────────────────

QUOTES_FILE     = SCRIPT_DIR / "data" / "quotes.json"
BANNER_TICKERS  = ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD"]

def refresh_quotes() -> None:
    """Fetch current prices for the home page banner and save to data/quotes.json."""
    print("   Refreshing banner prices…")
    quotes = []
    for sym in BANNER_TICKERS:
        q = finnhub_get("/quote", {"symbol": sym}) or {}
        price = q.get("c")
        chg   = q.get("dp")
        if price:
            sign = "+" if chg >= 0 else ""
            quotes.append({
                "sym":   sym,
                "price": f"{price:.2f}",
                "chg":   f"{sign}{chg:.2f}%",
                "up":    chg >= 0,
            })
        time.sleep(0.3)

    if quotes:
        with open(QUOTES_FILE, "w", encoding="utf-8") as f:
            json.dump(quotes, f, indent=2)
        print(f"   ✓  Prices updated for: {', '.join(q['sym'] for q in quotes)}")
    else:
        print("   ⚠  Could not fetch prices — quotes.json unchanged.")


# ─────────────────────────────────────────────────────────────
# STEP 4 — Screening: score tickers by news significance
# ─────────────────────────────────────────────────────────────

# Keywords that indicate a genuinely newsworthy event
HIGH_SIGNAL_KEYWORDS = [
    # Earnings & financials
    "earnings", "revenue", "eps", "profit", "loss", "guidance", "outlook",
    "beat", "miss", "raised", "lowered", "cut", "q1", "q2", "q3", "q4",
    "quarterly", "annual results", "full year", "fiscal",
    # Corporate events
    "acquisition", "merger", "takeover", "buyout", "deal", "contract",
    "partnership", "agreement", "joint venture", "spin-off", "ipo", "divest",
    # Management
    "ceo", "cfo", "cto", "coo", "president", "resign", "appoint",
    "hire", "departure", "replace", "named", "steps down",
    # Regulatory & legal
    "fda", "sec", "doj", "ftc", "lawsuit", "settlement", "approval",
    "rejection", "recall", "investigation", "fine", "penalty",
    # Capital markets
    "buyback", "dividend", "offering", "dilution", "debt", "upgrade",
    "downgrade", "price target", "initiated", "coverage",
]

PRICE_MOVE_THRESHOLD = 3.5  # flag any stock that moved more than this % today


def score_ticker(symbol: str) -> dict:
    """
    Lightweight screen of a single ticker. Returns:
      {
        "symbol":     str,
        "score":      int,    # 0 = no story, higher = more newsworthy
        "reasons":    list,   # human-readable reasons for the score
        "news_count": int,
        "price_chg":  float | None,
      }
    Only makes 2 API calls (news + quote). No candles, no targets.

    Freshness rule: keyword scoring ONLY applies to articles published in
    the last 36 hours (unix timestamp). Older articles in the window are
    counted for volume but do not boost the keyword score — this prevents
    stale recap/analysis pieces from inflating the score of old events.
    """
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=2)

    news_raw = finnhub_get("/company-news", {
        "symbol": symbol,
        "from":   start.isoformat(),
        "to":     end.isoformat(),
    })
    news = [i for i in (news_raw or []) if i.get("headline")]
    time.sleep(0.25)

    quote     = finnhub_get("/quote", {"symbol": symbol}) or {}
    price_chg = quote.get("dp")   # % change today
    time.sleep(0.25)

    # Split news into fresh (< 36 hours old) vs background
    now_ts    = datetime.datetime.utcnow().timestamp()
    fresh_cutoff = now_ts - 36 * 3600
    fresh_news = [i for i in news if (i.get("datetime") or 0) >= fresh_cutoff]

    score   = 0
    reasons = []

    # Score 1: volume of fresh news items
    if len(fresh_news) >= 3:
        score += 2
        reasons.append(f"{len(fresh_news)} fresh articles today")
    elif len(fresh_news) >= 1:
        score += 1
        reasons.append(f"{len(fresh_news)} fresh article(s) today")

    # Score 2: high-signal keywords — ONLY in fresh headlines
    # Cap keyword contribution for tickers with near-zero price moves to avoid
    # mega-caps with routine earnings coverage inflating their score (e.g. GOOGL -0.1%)
    fresh_headlines = " ".join(i.get("headline", "").lower() for i in fresh_news)
    matched = [kw for kw in HIGH_SIGNAL_KEYWORDS if kw in fresh_headlines]
    if matched:
        raw_keyword_score = len(matched) * 2
        # If price barely moved, cap keyword contribution at 8 pts (4 keywords worth)
        if price_chg is not None and abs(price_chg) < 1.0:
            raw_keyword_score = min(raw_keyword_score, 8)
        score += raw_keyword_score
        reasons.append(f"keywords: {', '.join(matched[:4])}")

    # Score 3: significant price move today (objective, timestamp-independent)
    if price_chg is not None and abs(price_chg) >= PRICE_MOVE_THRESHOLD:
        score += 5
        direction = "▲" if price_chg > 0 else "▼"
        reasons.append(f"price {direction}{abs(price_chg):.1f}% today")

    return {
        "symbol":     symbol,
        "score":      score,
        "reasons":    reasons,
        "news_count": len(fresh_news),
        "price_chg":  price_chg,
    }


def get_earnings_today(ticker_symbols: set) -> set:
    """
    Return the set of ticker symbols from our list that have ALREADY REPORTED
    earnings today — confirmed by the presence of actual results news.

    Logic:
      1. Check Finnhub earnings calendar for TODAY only (not tomorrow).
      2. For each calendar match, verify actual results exist in news
         (e.g. headlines containing "reports Q", "EPS of", "beats estimates").
      3. Only include tickers where results have been published.

    This prevents writing empty preview articles for companies that are
    scheduled to report but haven't done so yet.
    """
    today  = datetime.date.today()
    result = finnhub_get("/calendar/earnings", {
        "from": today.isoformat(),
        "to":   today.isoformat(),   # TODAY only — not tomorrow
    }) or {}

    # Keywords that confirm results have been PUBLISHED (not merely scheduled)
    RESULTS_KEYWORDS = [
        "reports q", "reported q", "quarterly results", "quarterly earnings",
        "eps of", "earnings per share", "net income", "revenue of",
        "beats estimates", "misses estimates", "beat expectations",
        "miss expectations", "topped estimates", "fell short",
        "raised guidance", "lowered guidance", "cut guidance",
        "first quarter", "second quarter", "third quarter", "fourth quarter",
        "q1 results", "q2 results", "q3 results", "q4 results",
        "profit rose", "profit fell", "revenue grew", "revenue declined",
        "results beat", "results miss", "above estimates", "below estimates",
    ]

    # Tickers on the calendar today that are in our watchlist
    calendar_hits = set()
    for item in result.get("earningsCalendar", []):
        sym = item.get("symbol", "").upper()
        if sym in ticker_symbols:
            calendar_hits.add(sym)

    if not calendar_hits:
        return set()

    # For each calendar hit, check whether actual results news exists
    confirmed = set()
    yesterday = today - datetime.timedelta(days=1)
    for sym in calendar_hits:
        news_raw = finnhub_get("/company-news", {
            "symbol": sym,
            "from":   yesterday.isoformat(),
            "to":     today.isoformat(),
        }) or []
        full_text = " ".join(
            (n.get("headline", "") + " " + n.get("summary", "")).lower()
            for n in news_raw
        )
        if any(kw in full_text for kw in RESULTS_KEYWORDS):
            confirmed.add(sym)
        time.sleep(0.3)

    return confirmed


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate AI stock articles")
    parser.add_argument("tickers", nargs="*", help="Ticker symbols (default: screen all in tickers.json)")
    parser.add_argument("--max",        type=int, default=15,  help="Max articles to generate per run (default: 15)")
    parser.add_argument("--min-score",  type=int, default=4,   help="Minimum significance score to generate an article (default: 4)")
    parser.add_argument("--top",        type=int, default=20,  help="Number of top-scored tickers to consider after screening (default: 20)")
    parser.add_argument("--no-screen",  action="store_true",   help="Skip screening phase (use with explicit ticker list)")
    args = parser.parse_args()

    # ── Validate API keys ──
    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set. Add it to your .env file.")
        sys.exit(1)
    if not FINNHUB_API_KEY:
        print("ERROR: FINNHUB_API_KEY not set. Add it to your .env file.")
        sys.exit(1)

    # ── Load full ticker list ──
    all_tickers = load_tickers()
    if not all_tickers:
        print("ERROR: No tickers found. Add tickers.json or us_stocks_formatted_comprehensive.csv to data/")
        sys.exit(1)
    ticker_map = {t["symbol"]: t for t in all_tickers}  # quick lookup by symbol

    print(f"\n🤖  Alpha Stocks Insight — Article Generator")
    print(f"    Date: {datetime.date.today()}")
    print()

    # ── Determine which tickers to process ──
    if args.tickers:
        # Specific tickers passed on command line — skip screening
        candidate_symbols = [s.upper() for s in args.tickers]
        ticker_list = [ticker_map.get(s, {"symbol": s, "exchange": "NASDAQ"}) for s in candidate_symbols]
        print(f"    Mode: targeted ({len(ticker_list)} ticker(s) specified)\n")
    elif args.no_screen:
        ticker_list = all_tickers
        print(f"    Mode: no-screen, all {len(ticker_list)} tickers\n")
    else:
        # ════════════════════════════════════════════════════
        # PHASE 1: SCREEN ALL TICKERS FOR NEWSFLOW
        # ════════════════════════════════════════════════════
        all_symbols = set(t["symbol"] for t in all_tickers)
        print(f"    Mode: full screen ({len(all_tickers)} tickers)\n")
        print(f"━━ PHASE 1: Screening for newsflow ━━")

        # Check earnings calendar first (always top priority)
        print(f"   Checking earnings calendar…")
        earnings_today = get_earnings_today(all_symbols)
        if earnings_today:
            print(f"   Earnings today/tomorrow: {', '.join(sorted(earnings_today))}")
        else:
            print(f"   No earnings today/tomorrow in your list.")
        time.sleep(0.5)

        # Screen all tickers
        scores = []
        total  = len(all_tickers)
        for i, ticker in enumerate(all_tickers, 1):
            symbol = ticker["symbol"]
            # Confirmed earnings reporters get top priority — results are already public
            if symbol in earnings_today:
                scores.append({"symbol": symbol, "score": 999, "reasons": ["earnings results published today"], "news_count": 1, "price_chg": None})
                continue
            result = score_ticker(symbol)
            if result["score"] > 0:
                scores.append(result)
            # Progress indicator every 50 tickers
            if i % 50 == 0 or i == total:
                hits = len(scores)
                print(f"   [{i}/{total}] {hits} candidate(s) found so far…")

        # Sort by score descending, take top N
        scores.sort(key=lambda x: x["score"], reverse=True)
        qualified = [s for s in scores if s["score"] >= args.min_score][:args.top]

        print(f"\n   Screening complete. {len(qualified)} ticker(s) qualified (score ≥ {args.min_score}):")
        for s in qualified:
            reasons = ", ".join(s["reasons"]) if s["reasons"] else f"{s['news_count']} news items"
            chg_str = f"  {s['price_chg']:+.1f}%" if s["price_chg"] is not None else ""
            print(f"   {'★ ' if s['symbol'] in earnings_today else '  '}{s['symbol']:6s}  score={s['score']:3d}  {reasons}{chg_str}")

        if not qualified:
            print("\n   No newsworthy tickers found today. Try again later or lower --min-score.")
            sys.exit(0)

        ticker_list = [ticker_map.get(s["symbol"], {"symbol": s["symbol"], "exchange": "NASDAQ"}) for s in qualified]
        print(f"\n━━ PHASE 2: Generating articles for {len(ticker_list)} ticker(s) ━━\n")

    existing  = load_articles()
    new_count = 0

    # ── Fetch full market data for all qualified tickers ──────
    print(f"   Fetching full market data for {len(ticker_list)} ticker(s)…\n")
    enriched = []   # list of {ticker, market_data, score}
    for ticker in ticker_list:
        symbol      = ticker["symbol"]
        market_data = fetch_market_data(symbol)
        if not market_data["news"]:
            print(f"   {symbol}: no news — skipping.")
            continue
        score = next((s["score"] for s in (scores if not args.tickers else []) if s["symbol"] == symbol), 5)
        enriched.append({"ticker": ticker, "market_data": market_data, "score": score})
        print(f"   {symbol}: {len(market_data['news'])} news, price ${market_data['quote'].get('c', 'N/A')}")

    if not enriched:
        print("\nNo tickers with news found.")
        sys.exit(0)

    # ── Split into premium vs quick-hit based on score ────────
    # Sort by score descending so the highest-signal tickers get Sonnet
    enriched.sort(key=lambda e: e["score"], reverse=True)
    all_premium     = [e for e in enriched if e["score"] >= PREMIUM_SCORE_THRESHOLD]
    # Apply hard cap: at most MAX_PREMIUM_ARTICLES use Sonnet
    premium_items   = all_premium[:MAX_PREMIUM_ARTICLES]
    overflow        = all_premium[MAX_PREMIUM_ARTICLES:]  # capped → Haiku instead
    quick_hit_items = overflow + [e for e in enriched if e["score"] < PREMIUM_SCORE_THRESHOLD]

    print(f"\n   Premium (Sonnet): {len(premium_items)} | Quick-hit (Haiku): {len(quick_hit_items)}")
    print(f"\n━━ PHASE 2: Generating content ━━\n")

    # ── PREMIUM articles (Sonnet, one at a time) ───────────────
    for item in premium_items:
        if args.max and new_count >= args.max:
            break
        ticker = item["ticker"]
        symbol = ticker["symbol"]
        print(f"── [PREMIUM] {symbol} {'─' * (34 - len(symbol))}")
        article = generate_article(ticker, item["market_data"])
        if not article:
            continue
        if already_covered(existing, symbol, article["title"]):
            print(f"   ⚠  Similar article already exists. Skipping.")
            continue
        existing.insert(0, article)
        new_count += 1
        print(f"   ✓  \"{article['title']}\"")

    # ── QUICK-HIT articles (Haiku, batched 5 at a time) ───────
    batch_size = 5
    for i in range(0, len(quick_hit_items), batch_size):
        if args.max and new_count >= args.max:
            break
        batch = quick_hit_items[i:i + batch_size]
        symbols = ", ".join(b["ticker"]["symbol"] for b in batch)
        print(f"── [QUICK-HIT batch] {symbols}")
        articles = generate_quick_hits_batch(batch)
        for article in articles:
            sym = article["tickers"][0]["symbol"] if article["tickers"] else "?"
            if already_covered(existing, sym, article["title"]):
                print(f"   ⚠  {sym}: similar article exists. Skipping.")
                continue
            existing.insert(0, article)
            new_count += 1
            print(f"   ✓  {sym}: \"{article['title']}\"")

    # ── DAILY ROUNDUP (Haiku, covers top tickers) ─────────────
    today_slug = f"roundup-{datetime.date.today().strftime('%Y-%m-%d')}"
    roundup_exists = any(a.get("slug") == today_slug for a in existing)
    if not roundup_exists and len(enriched) >= 3:
        print(f"\n── [ROUNDUP] Today's highlights ({min(8, len(enriched))} tickers)")
        roundup = generate_roundup(enriched)
        if roundup:
            existing.insert(0, roundup)
            new_count += 1
            print(f"   ✓  \"{roundup['title']}\"")

    if new_count == 0:
        print("\nNo new articles were added (no new news or all duplicates).")
    else:
        save_articles(existing)
        print(f"\n✅  {new_count} new article(s) added to data/articles.json")
        print(f"\nNext step — publish to your site:")
        print(f'   git add . && git commit -m "Add {new_count} AI-generated articles" && git push\n')

    # ── Cost summary ──────────────────────────────────────────
    print(f"━━ Cost Summary ━━")
    print(f"   Articles generated : {new_count}")
    print(f"   Tokens used        : {_tokens_in:,} in / {_tokens_out:,} out")
    print(f"   Estimated cost     : ${_cost_usd:.4f} USD")
    if new_count > 0:
        print(f"   Cost per article   : ${_cost_usd / new_count:.4f} USD")
    print()


if __name__ == "__main__":
    main()