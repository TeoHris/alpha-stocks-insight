// ============================================================
// GOOGLE ADSENSE PLACEHOLDER COMPONENT
// ============================================================
//
// HOW TO ACTIVATE REAL ADS:
//
// 1. In app/layout.tsx, uncomment the <Script> tag and replace
//    YOUR_PUBLISHER_ID with your real ca-pub-XXXXXXXXXXXX ID.
//
// 2. Replace the inner <div> in this component with:
//
//    <ins
//      className="adsbygoogle"
//      style={{ display: 'block' }}
//      data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
//      data-ad-slot="YOUR_AD_SLOT_ID"
//      data-ad-format="auto"
//      data-full-width-responsive="true"
//    />
//
// 3. Add the push call. Since this is a Client Component add:
//    useEffect(() => {
//      (window.adsbygoogle = window.adsbygoogle || []).push({})
//    }, [])
//
// 4. Mark this component as 'use client' after replacing.
//
// Common slot sizes to use:
//   728x90   → Leaderboard (top of page)
//   300x250  → Medium Rectangle (sidebar)
//   300x600  → Half Page (sidebar)
//   320x50   → Mobile Banner
//   native   → In-feed native ad
//   in-article → In-article interstitial
// ============================================================

interface AdPlaceholderProps {
  size: '728x90' | '300x250' | '300x600' | '320x50' | 'native' | 'in-article'
  className?: string
  label?: string
  id?: string
}

export default function AdPlaceholder({
  size,
  className = '',
  label,
  id,
}: AdPlaceholderProps) {
  // ── ADS HIDDEN until AdSense is approved ──────────────────
  // To re-enable: remove the line below and replace the inner
  // <div> contents with the real AdSense <ins> tag per the
  // instructions at the top of this file.
  return null

  // eslint-disable-next-line no-unreachable
  const heightMap: Record<string, string> = {
    '728x90': 'h-[90px]',
    '300x250': 'h-[250px]',
    '300x600': 'h-[300px]',
    '320x50':  'h-[50px]',
    'native':  'h-[100px]',
    'in-article': 'h-[120px]',
  }

  return (
    <div
      id={id}
      className={`w-full ${heightMap[size] ?? 'h-[90px]'} ${className}
        border-2 border-dashed border-gray-300 dark:border-gray-700
        bg-gray-50 dark:bg-gray-900/50
        flex flex-col items-center justify-center rounded-lg`}
    >
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 select-none">
        Advertisement
      </span>
      <span className="text-[10px] text-gray-300 dark:text-gray-700 mt-0.5 select-none">
        {label ?? size}
      </span>
    </div>
  )
}
