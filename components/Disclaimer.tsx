import { AlertTriangle } from 'lucide-react'

interface DisclaimerProps {
  variant?: 'bar' | 'box' | 'article'
  className?: string
}

const FULL_DISCLAIMER =
  'This is for informational purposes only and is not financial, investment, or tax advice. ' +
  'Past performance is no guarantee of future results. We are not licensed advisors. ' +
  'For Swiss residents: This does not constitute a public offer under FINSA. ' +
  'For EU residents: Not MiFID II compliant advice. ' +
  'For US residents: Not SEC-registered advice. ' +
  'Always consult a qualified professional. Investing involves risk of loss.'

export default function Disclaimer({ variant = 'bar', className = '' }: DisclaimerProps) {
  if (variant === 'box') {
    return (
      <div className={`rounded-xl border p-3.5 bg-amber-50 dark:bg-yellow-950/30 border-amber-200 dark:border-yellow-900 ${className}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={14}
            className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-yellow-500"
          />
          <p className="text-xs leading-relaxed text-amber-900 dark:text-yellow-300">
            <strong>Disclaimer:</strong> For informational purposes only. Not financial,
            investment, or tax advice. Past performance is no guarantee of future results.
            Consult a qualified professional before investing.
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'article') {
    return (
      <div className={`rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-yellow-950/30 p-4 my-6 ${className}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={16}
            className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-yellow-500"
          />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-yellow-300 mb-1">
              Important Legal Disclaimer
            </p>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-yellow-400">
              {FULL_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default: bar variant (used across all page bottoms)
  return (
    <div
      className={`border-t border-amber-200 dark:border-yellow-900/50 bg-amber-50 dark:bg-gray-900 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={13}
            className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-yellow-500"
          />
          <p className="text-xs leading-relaxed text-amber-900 dark:text-gray-400">
            <strong>Important Legal Disclaimer: </strong>
            {FULL_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  )
}
