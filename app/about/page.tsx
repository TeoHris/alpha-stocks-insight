import type { Metadata } from 'next'
import { TrendingUp, Cpu, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Alpha Stocks Insight — our mission, how we work, and how our AI-powered analysis is generated.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">About Alpha Stocks Insight</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Independent AI-Powered Stock Research</p>
        </div>
      </div>

      <div className="prose-like space-y-6 text-gray-700 dark:text-gray-300">

        <p className="text-base leading-relaxed">
          <strong>Alpha Stocks Insight</strong> is an independent financial news and analysis platform
          that uses artificial intelligence to generate original research, investment ideas, and market
          commentary on US-listed stocks. We cover companies trading on the NASDAQ and NYSE exchanges,
          with a particular focus on technology, semiconductors, AI infrastructure, and high-growth sectors.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          {[
            {
              icon: <Cpu size={20} className="text-blue-500" />,
              title: 'AI-Generated Analysis',
              desc: 'Our articles are drafted by AI agents that synthesize public financial data, earnings reports, analyst commentary, and market news into original investment ideas.',
            },
            {
              icon: <Shield size={20} className="text-green-500" />,
              title: 'Independent & Unbiased',
              desc: 'We are not affiliated with any broker, fund manager, or financial institution. We do not receive compensation to promote any security.',
            },
            {
              icon: <Zap size={20} className="text-amber-500" />,
              title: 'Daily Coverage',
              desc: 'AI agents generate new articles daily based on a curated watchlist of US stocks, pulling from public news and financial data sources.',
            },
            {
              icon: <TrendingUp size={20} className="text-purple-500" />,
              title: 'Educational Purpose',
              desc: 'All content is for educational and informational purposes only. We are not registered investment advisors and do not provide personalized financial advice.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{card.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">
          How Our Content Is Generated
        </h2>
        <p>
          Alpha Stocks Insight uses Claude AI agents (built on Anthropic's API) to generate
          original articles. The workflow is:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>An owner-uploaded stock list defines which tickers we cover.</li>
          <li>AI agents query public financial data APIs (Finnhub, Alpha Vantage, Yahoo Finance RSS) for the latest news, earnings data, and analyst estimates.</li>
          <li>Agents synthesize this data into original, structured articles with clear analysis sections, risk disclosures, and mandatory legal disclaimers.</li>
          <li>Articles are published to the site, with all ticker mentions prominently displayed.</li>
        </ol>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">
          Data Sources We Use
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Finnhub.io</strong> — Real-time stock quotes, company news, and earnings data (free tier)</li>
          <li><strong>Alpha Vantage</strong> — Historical price data, fundamentals, and news sentiment (free tier)</li>
          <li><strong>Yahoo Finance RSS</strong> — Financial news headlines per ticker</li>
          <li><strong>SEC EDGAR</strong> — Public company filings and earnings releases</li>
          <li><strong>Company investor relations pages</strong> — Official press releases</li>
        </ul>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">
          Contact
        </h2>
        <p className="text-sm">
          For questions, corrections, or partnership enquiries, please email:{' '}
          <a href="mailto:contact@alphastocksinsight.com" className="text-blue-600 dark:text-blue-400 underline">
            contact@alphastocksinsight.com
          </a>
        </p>

        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 mt-8">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">Important Disclaimer</p>
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
            This is for informational purposes only and is not financial, investment, or tax advice.
            Past performance is no guarantee of future results. We are not licensed advisors.
            For Swiss residents: This does not constitute a public offer under FINSA.
            For EU residents: Not MiFID II compliant advice.
            For US residents: Not SEC-registered advice.
            Always consult a qualified professional. Investing involves risk of loss.
          </p>
        </div>

      </div>
    </div>
  )
}
