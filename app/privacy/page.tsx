import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Watch Dat collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
      </div>

      <Section title="1. Information We Collect">
        <p>When you create an account, we collect:</p>
        <ul>
          <li><strong>Account information</strong> — your email address, username, display name, and password (stored as a salted bcrypt hash).</li>
          <li><strong>Profile content</strong> — any avatar image, banner image, or bio you choose to provide.</li>
          <li><strong>Usage data</strong> — films you log, ratings, reviews, diary entries, watchlist items, and lists you create.</li>
          <li><strong>Social data</strong> — follows, likes, comments, and recommendations you send or receive.</li>
        </ul>
        <p>We do <strong>not</strong> sell or rent your personal information to third parties.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To operate and improve Watch Dat (personalised film recommendations, activity feeds).</li>
          <li>To send in-app notifications about activity on your content (likes, comments, follows).</li>
          <li>To detect and prevent abuse via rate limiting and report moderation.</li>
          <li>To display your public profile and reviews to other users.</li>
        </ul>
      </Section>

      <Section title="3. Third-Party Services">
        <p>Watch Dat uses the following third-party services:</p>
        <ul>
          <li><strong>TMDB (The Movie Database)</strong> — film metadata, posters, and cast information. <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cinema-400 hover:underline">TMDB Privacy Policy</a>.</li>
          <li><strong>JustWatch</strong> — streaming availability data (via TMDB).</li>
          <li><strong>Vercel</strong> — hosting and serverless infrastructure. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cinema-400 hover:underline">Vercel Privacy Policy</a>.</li>
        </ul>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>Your data is stored in a PostgreSQL database hosted on a cloud provider. We use industry-standard practices including:</p>
        <ul>
          <li>Passwords hashed with bcrypt (cost factor 12).</li>
          <li>HTTPS for all data in transit.</li>
          <li>Session tokens stored as signed JWTs.</li>
          <li>Images stored as base64 data in the database (not on a public CDN) to prevent hotlinking.</li>
        </ul>
      </Section>

      <Section title="5. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access</strong> — request a copy of your personal data.</li>
          <li><strong>Correct</strong> — update your account information in Settings at any time.</li>
          <li><strong>Delete</strong> — permanently delete your account and all associated data from the <Link href="/settings" className="text-cinema-400 hover:underline">Settings</Link> page. Deletion is irreversible and removes all reviews, diary entries, lists, and follows.</li>
        </ul>
      </Section>

      <Section title="6. Cookies and Local Storage">
        <p>We use a single session cookie (HttpOnly, Secure, SameSite=Lax) to maintain your login state. We do not use tracking or advertising cookies. We use <code>localStorage</code> for client-side UI preferences (e.g. dark mode persistence).</p>
      </Section>

      <Section title="7. Children's Privacy">
        <p>Watch Dat is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us their information, please contact us to have it removed.</p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this policy from time to time. The date at the top reflects the most recent revision. Continued use of Watch Dat after changes constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="9. Contact">
        <p>Questions? Reach out via the <Link href="/settings" className="text-cinema-400 hover:underline">Settings</Link> page or open an issue on our GitHub repository.</p>
      </Section>

      <p className="text-xs text-muted-foreground border-t pt-4">
        See also our <Link href="/terms" className="text-cinema-400 hover:underline">Terms of Service</Link>.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_a]:text-cinema-400 [&_a]:hover:underline">
        {children}
      </div>
    </section>
  )
}
