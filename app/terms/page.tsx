import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Watch Dat — your digital film diary.',
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
      </div>

      <p className="text-sm text-muted-foreground">
        By using Watch Dat you agree to these terms. Please read them carefully.
      </p>

      <Section title="1. Acceptance of Terms">
        <p>These Terms of Service ("Terms") govern your use of Watch Dat ("the Service", "we", "us"). By creating an account or using the Service you agree to be bound by these Terms and our <Link href="/privacy" className="text-cinema-400 hover:underline">Privacy Policy</Link>.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 13 years old to use Watch Dat. By using the Service you represent that you meet this requirement. If you are under 18, a parent or legal guardian must consent to these Terms on your behalf.</p>
      </Section>

      <Section title="3. Your Account">
        <ul>
          <li>You are responsible for maintaining the security of your account password.</li>
          <li>You must not share your account with others or impersonate another person.</li>
          <li>You must provide accurate information when creating your account.</li>
          <li>We reserve the right to suspend or delete accounts that violate these Terms.</li>
        </ul>
      </Section>

      <Section title="4. User Content">
        <p>You retain ownership of content you create (reviews, diary entries, lists, profile content). By posting content you grant Watch Dat a worldwide, non-exclusive, royalty-free licence to display, reproduce, and distribute that content within the Service.</p>
        <p>You agree <strong>not</strong> to post content that:</p>
        <ul>
          <li>Is false, defamatory, harassing, hateful, or discriminatory.</li>
          <li>Infringes any copyright, trademark, or other intellectual property right.</li>
          <li>Contains spam, malware, or unsolicited commercial messages.</li>
          <li>Violates any applicable law or regulation.</li>
        </ul>
        <p>We may remove content that violates these Terms without notice.</p>
      </Section>

      <Section title="5. Film Data">
        <p>Film metadata, posters, and cast information are provided by <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-cinema-400 hover:underline">The Movie Database (TMDB)</a> under their terms of use. Watch Dat is not endorsed or certified by TMDB. Streaming availability data is sourced from JustWatch via TMDB.</p>
      </Section>

      <Section title="6. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Attempt to circumvent rate limits, scrape data at scale, or overload our servers.</li>
          <li>Reverse engineer, decompile, or otherwise attempt to extract source code.</li>
          <li>Use the Service for any unlawful purpose.</li>
          <li>Create accounts for the purpose of harassment or ban evasion.</li>
        </ul>
      </Section>

      <Section title="7. Blocking and Moderation">
        <p>Watch Dat provides tools to block other users and report content. Reports are reviewed by moderators. We reserve the right to take any action we deem appropriate, including removal of content and account suspension.</p>
      </Section>

      <Section title="8. Account Deletion">
        <p>You may delete your account at any time from the <Link href="/settings" className="text-cinema-400 hover:underline">Settings</Link> page. Deletion is permanent and removes all your data including reviews, diary entries, lists, and follows. Some data may persist in aggregated, anonymised form.</p>
      </Section>

      <Section title="9. Disclaimers">
        <p>The Service is provided "as is" without warranties of any kind. We do not guarantee continuous, uninterrupted, or error-free access to the Service. Film metadata accuracy is not guaranteed.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>To the fullest extent permitted by law, Watch Dat shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, even if we have been advised of the possibility of such damages.</p>
      </Section>

      <Section title="11. Changes to Terms">
        <p>We may update these Terms from time to time. Material changes will be communicated via in-app notice. Continued use of the Service after changes constitutes acceptance.</p>
      </Section>

      <Section title="12. Governing Law">
        <p>These Terms are governed by the laws of the jurisdiction in which Watch Dat operates, without regard to its conflict of law provisions.</p>
      </Section>

      <p className="text-xs text-muted-foreground border-t pt-4">
        See also our <Link href="/privacy" className="text-cinema-400 hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_a]:text-cinema-400 [&_a]:hover:underline">
        {children}
      </div>
    </section>
  )
}
