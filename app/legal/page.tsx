import type { Metadata } from 'next'
import { Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Legal notices, disclaimers, privacy policy, and terms of service for Alpha Stocks Insight.',
}

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Scale size={24} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Legal Notices</h1>
      </div>

      <div className="space-y-10 text-sm text-gray-700 dark:text-gray-300">

        {/* Full Disclaimer */}
        <section id="disclaimer">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Full Investment Disclaimer
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>
              <strong>This website and all content published on it is for informational and educational
              purposes only. Nothing on this website constitutes financial, investment, tax, legal, or
              any other form of professional advice.</strong>
            </p>
            <p>
              Past performance of any financial instrument, investment strategy, or stock discussed
              on this website is not a guarantee of future results. All investments involve risk,
              including the possible loss of principal. The value of investments can go down as well
              as up.
            </p>
            <p>
              Alpha Stocks Insight is not a registered investment advisor, broker-dealer, or financial
              planner under any applicable law or regulation. We do not hold any licenses to provide
              investment advice in any jurisdiction.
            </p>
            <p>
              The content published on this website is generated with the assistance of artificial
              intelligence and is not reviewed by licensed financial professionals before publication.
              It may contain errors, inaccuracies, or omissions.
            </p>
            <p>
              <strong>Always consult a qualified financial professional before making any investment decision.</strong>
            </p>
          </div>
        </section>

        {/* Jurisdiction-specific notices */}
        <section id="finsa">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Jurisdiction-Specific Notices
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold mb-2">🇨🇭 Switzerland (FINSA)</h3>
              <p>The content on this website does not constitute a public offer or solicitation within the meaning of the Swiss Financial Services Act (FINSA) or any other applicable Swiss law. This website is not directed at Swiss residents and does not constitute advice or a recommendation to buy or sell any financial instrument in Switzerland.</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold mb-2">🇪🇺 European Union (MiFID II)</h3>
              <p>The content on this website does not constitute investment advice, investment research, or a personal recommendation as defined under MiFID II (Directive 2014/65/EU). This website is not regulated by any EU financial regulator and its content has not been prepared in accordance with EU investment research requirements.</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-bold mb-2">🇺🇸 United States (SEC)</h3>
              <p>Alpha Stocks Insight is not registered with the U.S. Securities and Exchange Commission (SEC) as an investment advisor, broker-dealer, or any other regulated entity. The content on this website does not constitute investment advice under the Investment Advisers Act of 1940 or any other U.S. securities law. This website is provided for informational purposes only.</p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Privacy Policy
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>Alpha Stocks Insight respects your privacy. This policy explains what data we collect and how we use it.</p>
            <p><strong>Data We Collect:</strong> We may collect anonymous analytics data (page views, referral sources) through analytics tools. If you subscribe to our newsletter, we collect your email address. Your watchlist is stored locally in your browser (localStorage) and is not transmitted to our servers.</p>
            <p><strong>Cookies:</strong> We use essential cookies for site functionality. If Google AdSense is active, it may set advertising cookies. You can manage cookie preferences via your browser settings.</p>
            <p><strong>GDPR:</strong> If you are located in the EU/EEA, you have the right to access, correct, and delete your personal data. Contact us at <a href="mailto:privacy@alphastocksinsight.com" className="text-blue-600 dark:text-blue-400 underline">privacy@alphastocksinsight.com</a>.</p>
          </div>
        </section>

        {/* Terms */}
        <section id="terms">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Terms of Service
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>By accessing and using Alpha Stocks Insight, you agree to these terms. If you do not agree, please discontinue use of this website.</p>
            <p>All content on this website is protected by copyright and may not be reproduced, distributed, or used commercially without express written permission from Alpha Stocks Insight.</p>
            <p>We reserve the right to modify, suspend, or discontinue the website or any of its features at any time without notice.</p>
            <p>Your use of this website is at your sole risk. Alpha Stocks Insight is not liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or any content herein.</p>
          </div>
        </section>

        {/* Cookies */}
        <section id="cookies">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Cookie Policy
          </h2>
          <p className="leading-relaxed">
            This website uses cookies for essential site functionality (theme preferences, navigation state).
            If advertising is enabled via Google AdSense, additional third-party cookies may be set for
            advertising purposes. You can disable cookies in your browser settings, though this may affect
            site functionality.
          </p>
        </section>

        {/* GDPR */}
        <section id="gdpr">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            GDPR Data Rights (EU/EEA Residents)
          </h2>
          <p className="leading-relaxed mb-2">
            Under the General Data Protection Regulation (GDPR), EU and EEA residents have the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Right of Access</strong> — You may request a copy of personal data we hold about you.</li>
            <li><strong>Right to Rectification</strong> — You may request correction of inaccurate personal data.</li>
            <li><strong>Right to Erasure</strong> — You may request deletion of your personal data (&apos;right to be forgotten&apos;).</li>
            <li><strong>Right to Portability</strong> — You may request your data in a machine-readable format.</li>
            <li><strong>Right to Object</strong> — You may object to certain uses of your data.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact:{' '}
            <a href="mailto:privacy@alphastocksinsight.com" className="text-blue-600 dark:text-blue-400 underline">
              privacy@alphastocksinsight.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
