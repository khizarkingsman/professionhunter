
export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">1. Introduction</h2>
            <p>Welcome to HandyConnect ("we", "us", or "our"). These Terms of Service govern your use of our website and mobile application (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these terms.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">2. Accounts</h2>
            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">3. User Conduct</h2>
            <p>You agree not to use the Service to: (a) upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable; (b) harm minors in any way; (c) impersonate any person or entity, including, but not limited to, a HandyConnect official, forum leader, guide or host, or falsely state or otherwise misrepresent your affiliation with a person or entity.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of HandyConnect and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">5. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">6. Limitation of Liability</h2>
            <p>In no event shall HandyConnect, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">7. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">8. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@handyconnect.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
