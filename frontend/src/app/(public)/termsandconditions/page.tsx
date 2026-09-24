import React from "react";

const sections = [
  {
    title: "The Brixlore Platform",
    text: [
      "Brixlore is a subscription-based digital streaming platform providing access to video programming, original productions, licensed programming, documentaries, series, events, and other entertainment and informational content. Brixlore may modify, expand, suspend, or discontinue portions of the Platform or its programming at any time.",
      "Content availability may vary based on subscription level, geographic location, licensing rights, device compatibility, and other factors.",
    ],
  },
  {
    title: "Eligibility",
    text: [
      "Brixlore is intended for adults and its content is designated 18+ . By using Brixlore, you represent that:",
      "You are at least 18 years old; You have the legal capacity to enter into these Terms; The information you provide to Brixlore is accurate and current; and Your use of Brixlore does not violate any applicable law or regulation.",
      "Brixlore reserves the right to restrict or terminate accounts that do not satisfy applicable eligibility requirements.",
    ],
  },
  {
    title: "Brixlore Accounts",
    text: [
      "Certain Platform features require you to create an account. You are responsible for:",
      "Providing accurate account information; Maintaining the confidentiality of your login credentials; Maintaining the security of your account; Restricting access to your account; All activity occurring through your account, except where caused by circumstances outside your reasonable control.",
      "You must notify Brixlore promptly if you believe your account credentials have been compromised or your account has been accessed without authorization. Brixlore may suspend or terminate accounts that violate these Terms or applicable law.",
    ],
  },
  {
    title: "Subscriptions",
    text: [
      "Certain Brixlore content and features may require a paid subscription. Subscription plans, pricing, included features, advertising levels, and content availability may vary and may change from time to time.",
      "When you purchase a subscription, you authorize Brixlore or its designated payment provider to charge the applicable subscription fee and any applicable taxes or other disclosed charges.",
      "Unless otherwise stated at the time of purchase, subscriptions may automatically renew at the applicable recurring interval until canceled. You are responsible for reviewing your subscription details before completing a purchase.",
    ],
  },
  {
    title: "Free Trials, Promotions, and Offers",
    text: [
      "Brixlore may occasionally provide promotional offers, discounts, trial periods, promotional access, or other special offers. The specific terms of an offer will be presented when the offer is made available.",
      "Unless otherwise stated, promotional offers may be limited to eligible users and may not be combined with other offers. Brixlore reserves the right to modify or discontinue promotional offers at any time, subject to applicable law.",
    ],
  },
  {
    title: "Billing and Payment",
    text: [
      "Payments may be processed by Brixlore or third-party payment processors. By providing payment information, you represent that you are authorized to use the applicable payment method.",
      "You authorize the applicable payment provider to charge the subscription or purchase amount associated with your account. If a payment is declined, reversed, disputed, or otherwise unsuccessful, Brixlore may suspend or terminate access to paid features until payment is successfully received.",
    ],
  },
  {
    title: "Cancellation",
    text: [
      "You may cancel your subscription through the account-management or subscription-management method provided by Brixlore or the applicable third-party platform through which you purchased the subscription.",
      "Cancellation generally prevents future renewal but does not necessarily provide a refund for the unused portion of a current billing period. Unless otherwise required by applicable law or expressly stated at the time of purchase, subscription fees are non-refundable.",
      "If you subscribed through Apple, Google, Roku, Amazon, or another third-party marketplace or platform, additional cancellation and refund rules may apply.",
    ],
  },
  {
    title: "Refunds",
    text: [
      "Refunds are handled according to Brixlore's applicable refund policies and applicable law. Where a subscription was purchased through a third-party platform, refund requests may need to be submitted directly to that platform.",
      "Brixlore reserves the right to provide refunds or credits on a case-by-case basis where appropriate. Nothing in these Terms limits any refund rights that cannot legally be waived.",
    ],
  },
  {
    title: "Content Availability",
    text: [
      "Brixlore does not guarantee that any particular program, series, episode, film, event, or other content will remain available indefinitely. Content may become unavailable because of:",
      "Licensing restrictions; Geographic restrictions; Distribution agreements; Expiration of rights; Technical issues; Business decisions; Legal requirements; Programming changes.",
      "Brixlore may add, remove, replace, modify, or reorganize content at any time.",
    ],
  },
  {
    title: "Streaming and Device Requirements",
    text: [
      "Brixlore may be accessible through compatible computers, smartphones, tablets, smart televisions, streaming devices, applications, browsers, and other supported devices. Device compatibility may change over time.",
      "You are responsible for obtaining and maintaining the necessary internet connection, compatible device, software, and other equipment required to access Brixlore.",
      "Streaming quality may vary depending on your internet connection, device, network conditions, geographic location, and other technical factors. Brixlore does not guarantee uninterrupted or error-free streaming.",
    ],
  },
  {
    title: "Advertising and Sponsored Content",
    text: [
      "Certain Brixlore subscription plans or content may include advertisements, promotional material, sponsorships, or other commercial messages. Advertising may appear before, during, after, or around content.",
      "Brixlore may also provide sponsored programming, branded integrations, promotional placements, or other commercial arrangements. The presence of advertising or sponsorship does not constitute an endorsement of the advertised company, product, service, or claim unless expressly stated by Brixlore.",
    ],
  },
  {
    title: "Intellectual Property",
    text: [
      "The Brixlore Platform and its content are protected by copyright, trademark, trade secret, and other applicable intellectual-property laws.",
      "Unless expressly stated otherwise, Brixlore and its licensors own or control the rights in the Platform and Brixlore-produced or Brixlore-controlled content.",
      "Brixlore's name, trademarks, logos, designs, graphics, interfaces, software, compilations, and other proprietary materials may not be copied, reproduced, modified, distributed, publicly displayed, transmitted, sold, licensed, or otherwise exploited without authorization.",
      "Your subscription provides you with a limited, personal, non-exclusive, non-transferable, revocable right to access and view authorized Brixlore content for personal, non-commercial purposes during the applicable subscription period. Your subscription does not transfer ownership of any Brixlore content to you.",
    ],
  },
  {
    title: "Restrictions on Content",
    text: [
      "Unless expressly authorized by Brixlore or permitted by applicable law, you may not:",
      "Download, copy, record, reproduce, or redistribute Brixlore content; Capture or retransmit streams; Circumvent digital rights management or other technical protections; Remove copyright, trademark, or other proprietary notices; Publicly display or commercially exploit Brixlore content; Sell, sublicense, rent, lease, or transfer access to your account; Use automated systems to access or collect content from the Platform; Attempt to reverse engineer or interfere with the Platform; Use Brixlore content to train artificial intelligence or machine-learning systems without written authorization; Use Brixlore content to create unauthorized derivative works; Circumvent geographic, subscription, or access restrictions.",
    ],
  },
  {
    title: "Prohibited Conduct",
    text: [
      "You agree not to use Brixlore to:",
      "Violate any applicable law; Commit fraud or engage in deceptive activity; Interfere with Platform operations; Gain unauthorized access to accounts, systems, or networks; Distribute malware or harmful code; Circumvent security measures; Abuse promotional offers; Impersonate another person or entity; Harvest information from other users; Scrape, crawl, or systematically extract Platform data without authorization; Exploit the Platform for unauthorized commercial purposes; Engage in activity that could damage, disable, overburden, or impair the Platform.",
      "Brixlore may take appropriate action against accounts or activity that violates these restrictions.",
    ],
  },
  {
    title: "User Communications and Submissions",
    text: [
      "If Brixlore allows you to submit comments, reviews, feedback, suggestions, messages, ideas, or other material, you retain ownership of your underlying rights in your submissions.",
      "However, by submitting material to Brixlore, you grant Brixlore a worldwide, non-exclusive, royalty-free, transferable, sublicensable license to use, reproduce, modify, distribute, display, perform, publish, and otherwise use the submission in connection with operating, promoting, improving, and developing Brixlore and its services.",
      "You represent that you have the rights necessary to provide the submission and grant the license described above. Brixlore may remove or decline to publish submissions at its discretion.",
    ],
  },
  {
    title: "Copyright Complaints",
    text: [
      "Brixlore respects intellectual-property rights. If you believe content available through Brixlore infringes your copyright, you may submit a copyright complaint containing sufficient information for Brixlore to evaluate the claim.",
      "Brixlore may remove or restrict access to allegedly infringing material where appropriate and may take additional action consistent with applicable law. Copyright notices may be submitted through the contact information provided below.",
    ],
  },
  {
    title: "Third-Party Services",
    text: [
      "Brixlore may integrate with or link to third-party services, including payment processors, app stores, streaming platforms, advertising providers, analytics services, social networks, and other technology providers.",
      "Third-party services are governed by their own terms and policies. Brixlore is not responsible for the availability, functionality, policies, or practices of third-party services.",
    ],
  },
  {
    title: "Privacy",
    text: [
      "Your use of Brixlore is also governed by the Brixlore Privacy Policy, which explains how Brixlore collects, uses, discloses, retains, and otherwise processes information.",
      "The Privacy Policy is incorporated into these Terms by reference.",
    ],
  },
  {
    title: "Changes to the Platform",
    text: [
      "Brixlore may modify, update, suspend, or discontinue any portion of the Platform at any time. This may include changes to:",
      "Content; Features; Subscription plans; Pricing; Advertising; Supported devices; Applications; Technical requirements; Platform functionality.",
      "Where required by applicable law, Brixlore will provide notice of material changes.",
    ],
  },
  {
    title: "Changes to These Terms",
    text: [
      "Brixlore may update these Terms from time to time. When we make changes, we may update the Effective Date and provide additional notice when required by applicable law.",
      "Your continued use of Brixlore after updated Terms become effective constitutes your acceptance of the revised Terms to the extent permitted by law. If you do not agree with revised Terms, you must discontinue use of the Platform.",
    ],
  },
  {
    title: "Suspension and Termination",
    text: [
      "Brixlore may suspend or terminate your access to the Platform if:",
      "You violate these Terms; You engage in fraudulent or abusive activity; Your payment obligations are not satisfied; Your account creates a security risk; Your use violates applicable law; Brixlore is required to do so by law; Brixlore discontinues the applicable service; or Brixlore otherwise determines that suspension or termination is necessary to protect the Platform, its users, or its business.",
      "Upon termination, your right to access paid content and Platform features may immediately end. Provisions that by their nature should survive termination will continue to apply.",
    ],
  },
  {
    title: "Disclaimers",
    text: [
      "To the maximum extent permitted by applicable law, Brixlore provides the Platform on an “as available” and “as is” basis. Brixlore does not guarantee that:",
      "The Platform will always be available; Streaming will be uninterrupted; Content will always be available; The Platform will be free from errors or technical problems; The Platform will be compatible with every device; Information available through the Platform will always be complete or current; The Platform will be free from harmful components.",
      "Nothing in these Terms excludes warranties or rights that cannot legally be excluded.",
    ],
  },
  {
    title: "Limitation of Liability",
    text: [
      "To the maximum extent permitted by applicable law, Brixlore LLC and its officers, directors, employees, contractors, affiliates, licensors, service providers, and partners will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from or related to your use of, or inability to use, the Platform.",
      "To the maximum extent permitted by law, Brixlore's total liability arising out of or relating to the Platform or these Terms will be limited to the greater of: The amount you paid to Brixlore for the applicable service during the twelve months preceding the event giving rise to the claim; or One hundred U.S. dollars ($100).",
      "This limitation does not apply where prohibited by applicable law.",
    ],
  },
  {
    title: "Indemnification",
    text: [
      "To the maximum extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Brixlore LLC and its officers, directors, employees, contractors, affiliates, licensors, and service providers from claims, liabilities, damages, losses, costs, and expenses, including reasonable attorneys' fees, arising out of or related to:",
      "Your violation of these Terms; Your misuse of the Platform; Your violation of applicable law; Your violation of another person's rights; or Content or material you submit through the Platform.",
    ],
  },
  {
    title: "Governing Law",
    text: [
      "These Terms will be governed by the laws applicable to Brixlore LLC, without regard to conflict-of-law principles, except where applicable law requires otherwise.",
      "Any dispute-resolution provisions required by applicable law will apply notwithstanding this section.",
    ],
  },
  {
    title: "Dispute Resolution",
    text: [
      "Before initiating formal legal proceedings concerning a dispute with Brixlore, you agree to contact Brixlore and provide a reasonable opportunity to resolve the dispute informally.",
      "Nothing in this section prevents you from exercising rights that cannot legally be waived, including applicable consumer-protection or privacy rights.",
      "Any arbitration, class-action waiver, or forum-selection provision will apply only to the extent permitted by applicable law and may be provided in a separate or updated agreement where required.",
    ],
  },
  {
    title: "Severability",
    text: [
      "If any provision of these Terms is determined to be invalid, unlawful, or unenforceable, that provision will be enforced to the maximum extent permitted by law, and the remaining provisions will remain in effect.",
    ],
  },
  {
    title: "No Waiver",
    text: [
      "Brixlore's failure to enforce any provision of these Terms does not constitute a waiver of that provision or Brixlore's right to enforce it later.",
    ],
  },
  {
    title: "Entire Agreement",
    text: [
      "These Terms, together with the Brixlore Privacy Policy and any additional terms expressly incorporated into the Platform, constitute the agreement between you and Brixlore concerning your use of the Platform.",
      "If additional terms apply to a particular service, promotion, subscription, or feature, those terms may supplement or supersede portions of these Terms.",
    ],
  },
  {
    title: "Contact",
    text: [
      "Questions concerning these Terms may be directed to:",
      "Brixlore LLC Email: support@brixlore.tv Website: Brixlore.tv",
    ],
  },
];

function Page() {
  return (
    <main className="min-h-screen bg-[#f4f2ed] text-black">
      <header className="border-b border-black/10 bg-[#0b0b0e] px-5 pb-14 pt-28 text-white sm:px-8 sm:pb-20 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Legal / Terms</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Brixlore Terms &amp; Conditions</h1>
          <p className="mt-5 text-sm text-white/60">Effective Date: April 13th, 2026</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-20">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">On this page</p>
          <nav className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-black/10 pt-4 lg:grid-cols-1" aria-label="Terms and conditions sections">
            {sections.map((section, index) => (
              <a key={section.title} href={`#section-${index + 1}`} className="text-sm text-black/55 transition-colors hover:text-black">
                <span className="mr-2 text-[10px] text-black/35">{String(index + 1).padStart(2, "0")}</span>{section.title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 max-w-3xl text-[15px] leading-7 text-black/70 [&_h2]:mb-5 [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-black/10 [&_h2]:pb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-black [&_h2]:sm:text-3xl">
          <div className="border-b border-black/10 pb-8">
            <p className="mb-5">Brixlore Terms &amp; Conditions</p>
            <p className="mb-5">Effective Date: April 13th, 2026</p>
            <p className="mb-5">These Terms &amp; Conditions (“Terms”) govern your access to and use of the Brixlore streaming platform and related services operated by Brixlore LLC (“Brixlore, ” “we, ” “us, ” or “our”).</p>
            <p className="mb-5">By accessing, creating an account for, subscribing to, or using Brixlore, you agree to be bound by these Terms.</p>
            <p className="mb-5">If you do not agree with these Terms, you may not access or use the Platform.</p>
          </div>
          {sections.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-28">
              <h2>{String(index + 1).padStart(2, "0")} · {section.title}</h2>
              <div className="space-y-5">
                {section.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
          <footer className="mt-12 border-t border-black/10 pt-8 text-sm text-black/50">
            Brixlore LLC<br />Terms &amp; Conditions — Effective April 13th, 2026
          </footer>
        </article>
      </div>
    </main>
  );
}

export default Page;

