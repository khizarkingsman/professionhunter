
export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">1. Introduction</h2>
            <p>Welcome to Profession Hunter ("we", "us", or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at privacy@professionhunter.com.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and services, when you participate in activities on the Service or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the Service, the choices you make and the products and features you use. The personal information we collect may include the following: name, phone number, email address, mailing address, username, passwords, and contact preferences.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">3. How We Use Your Information</h2>
            <p>We use personal information collected via our Service for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">4. Will Your Information Be Shared?</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, Legal Obligations.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">5. How Long We Keep Your Information</h2>
            <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law. When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">6. Security of Your Information</h2>
            <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">7. Your Privacy Rights</h2>
            <p>In some regions (like the European Economic Area), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">8. Updates to This Policy</h2>
            <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold font-headline text-foreground">9. Contact Us</h2>
            <p>If you have questions or comments about this policy, you may email us at privacy@professionhunter.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
