import React from "react";

const sectionTitles = [
  "Information We Collect",
  "How We Use Information",
  "Cookies and Similar Technologies",
  "Advertising",
  "Sale, Sharing, and Disclosure of Information",
  "Service Providers",
  "Business Transfers",
  "Legal Disclosures",
  "Data Retention",
  "Data Security",
  "Your Privacy Choices and Rights",
  "California Privacy Rights",
  "Do Not Sell or Share My Personal Information",
  "Children's Privacy",
  "Third-Party Services and Links",
  "International Users",
  "Changes to This Privacy Policy",
  "Contact Us",
];

function Page() {
  return (
    <main className="min-h-screen bg-[#f4f2ed] text-black">
      <header className="border-b border-black/10 bg-[#0b0b0e] px-5 pb-14 pt-28 text-white sm:px-8 sm:pb-20 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Legal / Privacy
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Brixlore Privacy Policy
          </h1>
          <p className="mt-5 text-sm text-white/60">
            Effective Date: April 13th, 2026
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-20">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            On this page
          </p>
          <nav
            className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-black/10 pt-4 lg:grid-cols-1"
            aria-label="Privacy policy sections"
          >
            {sectionTitles.map((title, index) => {
              const number = index + 1;
              return (
                <a
                  key={number}
                  href={`#section-${number}`}
                  className="text-sm text-black/55 transition-colors hover:text-black"
                >
                  <span className="mr-2 text-[10px] text-black/35">
                    {String(number).padStart(2, "0")}
                  </span>
                  {title}
                </a>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl text-[15px] leading-7 text-black/70 [&_h2]:mb-5 [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-black/10 [&_h2]:pb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-black [&_h2]:sm:text-3xl">
          <div className="border-b border-black/10 pb-8">
            <p className="mb-5">
              Brixlore LLC (“Brixlore,” “we,” “us,” or “our”) operates the
              Brixlore streaming platform and related digital services
              (collectively, the “Platform”).
            </p>
            <p className="mb-5">
              This Privacy Policy explains how Brixlore collects, uses, stores,
              shares, discloses, and may sell information collected through the
              Platform.
            </p>
            <p>
              By accessing or using Brixlore, you acknowledge that you have read
              and understood this Privacy Policy.
            </p>
          </div>
          <section id="section-1">
            <h2>01 · Information We Collect</h2>
            <p>
              Brixlore may collect information directly from you, automatically
              through your use of the Platform, and from third parties.
            </p>
            <p>
              Depending on how you use Brixlore, information we collect may
              include:
            </p>
            <h3 className="text-lg font-semibold text-black">Information You Provide</h3>
            <p>
              Information You Provide Name Email address Telephone number
              Username and account information Password and authentication
              information Billing and subscription information Payment-related
              information Customer service communications Information submitted
              through forms, surveys, promotions, or other Platform features
              Preferences and other information you voluntarily provide
            </p>
            <p>
              Payment information may be processed by third-party payment
              providers. Brixlore may receive information about your transaction
              without directly storing complete payment-card information.
            </p>
            <h3 className="text-lg font-semibold text-black">Information Collected Automatically</h3>
            <p>
              When you access or use Brixlore, we may automatically collect
              information such as:
            </p>
            <p>
              IP address Browser type and version Device type and operating
              system Device identifiers Advertising identifiers Internet and
              network information Approximate location information Usage
              information Pages, screens, and features accessed Search activity
              Viewing and streaming history Content interactions Session
              information Referral information Cookies, pixels, tags, SDKs, and
              similar technologies Information regarding how you interact with
              advertisements and promotional content
            </p>
            <h3 className="text-lg font-semibold text-black">Viewing and Platform Activity</h3>
            <p>
              Because Brixlore is a streaming platform, we may collect
              information concerning your interaction with content, including
              the titles you view, viewing duration, completion activity,
              browsing behavior, searches, preferences, interactions, and other
              activity associated with your account or device.
            </p>
            <p>
              This information may be used to operate, personalize, analyze,
              market, and improve the Platform.
            </p>
          </section>
          <section id="section-2">
            <h2>02 · How We Use Information</h2>
            <p>
              Brixlore may use collected information for purposes including:
            </p>
            <p>
              Providing and operating the Platform Creating and managing user
              accounts Processing subscriptions and transactions Delivering
              streaming content Personalizing content and recommendations
              Understanding how users interact with Brixlore Measuring audience
              and content performance Developing and improving products and
              services Conducting analytics and research Communicating with
              users Sending transactional communications Sending marketing
              communications Providing customer support Advertising and
              promotional activities Measuring advertising performance
              Preventing fraud, abuse, and unauthorized access Maintaining the
              security and integrity of the Platform Troubleshooting technical
              issues Complying with applicable law Enforcing our agreements and
              policies Protecting the rights, property, and safety of Brixlore,
              our users, and others Other purposes disclosed at the time
              information is collected or otherwise permitted by law
            </p>
          </section>
          <section id="section-3">
            <h2>03 · Cookies and Similar Technologies</h2>
            <p>
              Brixlore may use cookies, pixels, web beacons, software
              development kits, local storage, tags, and similar technologies.
              These technologies may be used to: Keep users signed in Remember
              preferences Understand Platform usage Measure performance Analyze
              audience behavior Personalize experiences Deliver or measure
              advertising Understand interactions with promotional content
              Detect fraud and security threats Improve the Platform
            </p>
            <p>
              Third-party companies may also use similar technologies in
              connection with Brixlore services. Your browser or device may
              provide controls for managing certain cookies and similar
              technologies. Disabling certain technologies may affect Platform
              functionality.
            </p>
          </section>
          <section id="section-4">
            <h2>04 · Advertising</h2>
            <p>
              Brixlore may display advertising and promotional content on or in
              connection with the Platform. Advertising may be provided by
              Brixlore, advertisers, sponsors, advertising networks, technology
              providers, or other third parties.
            </p>
            <p>
              Information concerning your device, activity, interests,
              interactions, or use of the Platform may be used to provide,
              personalize, measure, or analyze advertising, where permitted by
              applicable law. Brixlore may also use information to measure the
              effectiveness of advertising campaigns and sponsorships.
            </p>
          </section>
          <section id="section-5">
            <h2>05 · Sale, Sharing, and Disclosure of Information</h2>
            <p>
              Brixlore may disclose information to third parties for business,
              operational, advertising, analytics, marketing, research,
              transactional, and other permitted purposes. Depending on
              applicable law and our business practices, Brixlore may also sell
              or otherwise provide personal information to third parties.
              Potential recipients may include: Advertising and marketing
              companies Analytics providers Business partners Sponsors Content
              and distribution partners Technology providers Data and
              information companies Service providers Payment processors Cloud
              and hosting providers Customer-support providers Security and
              fraud-prevention providers Other third parties involved in
              operating or developing Brixlore
            </p>
            <p>
              Information that may be disclosed or sold can include categories
              such as identifiers, commercial information, internet or network
              activity, device information, viewing activity, usage information,
              preferences, and other information permitted by applicable law.
              Brixlore does not sell information for purposes that are
              prohibited by applicable law. Where applicable law provides you
              with the right to opt out of the sale or sharing of your personal
              information, Brixlore will provide mechanisms for exercising that
              right.
            </p>
          </section>
          <section id="section-6">
            <h2>06 · Service Providers</h2>
            <p>
              Brixlore may provide information to companies that perform
              services on our behalf. These companies may assist with: Hosting
              Streaming and content delivery Payments Email SMS Analytics
              Advertising Customer service Authentication Security Fraud
              prevention Data processing Marketing Technical operations. These
              providers may access information as necessary to perform services
              for Brixlore and as otherwise permitted by applicable law.
            </p>
          </section>
          <section id="section-7">
            <h2>07 · Business Transfers</h2>
            <p>
              If Brixlore is involved in a merger, acquisition, financing,
              restructuring, sale of assets, bankruptcy, reorganization, joint
              venture, or similar transaction, information associated with the
              Platform may be transferred as part of that transaction.
              Information may also be disclosed when reasonably necessary to
              evaluate or complete such a transaction.
            </p>
          </section>
          <section id="section-8">
            <h2>08 · Legal Disclosures</h2>
            <p>
              Brixlore may disclose information when we believe disclosure is
              necessary or appropriate to: Comply with applicable law,
              regulation, legal process, subpoena, or court order Respond to
              lawful requests from governmental authorities Protect the rights,
              property, or safety of Brixlore Protect users or the public
              Investigate fraud, abuse, security incidents, or other unlawful
              activity Enforce our Terms of Service or other agreements Defend
              legal claims
            </p>
          </section>
          <section id="section-9">
            <h2>09 · Data Retention</h2>
            <p>
              Brixlore may retain information for as long as reasonably
              necessary for the purposes described in this Privacy Policy,
              including providing services, maintaining accounts, fulfilling
              business and legal obligations, resolving disputes, enforcing
              agreements, preventing fraud, maintaining security, and legitimate
              business purposes. Different categories of information may be
              retained for different periods. Deleting an account does not
              necessarily mean that all information will be immediately or
              permanently deleted where Brixlore is permitted or required to
              retain information for legitimate business, legal, security,
              fraud-prevention, or other permitted purposes.
            </p>
          </section>
          <section id="section-10">
            <h2>10 · Data Security</h2>
            <p>
              Brixlore uses reasonable administrative, technical, and
              organizational measures designed to protect information against
              unauthorized access, disclosure, alteration, and destruction.
              However, no internet transmission, electronic storage system, or
              method of communication can be guaranteed to be completely secure.
              You are responsible for maintaining the confidentiality of your
              account credentials and for notifying Brixlore if you believe your
              account has been accessed without authorization.
            </p>
          </section>
          <section id="section-11">
            <h2>11 · Your Privacy Choices and Rights</h2>
            <p>
              Depending on where you live and applicable law, you may have
              certain rights concerning your personal information. These rights
              may include the right to: Know or access information collected
              about you Request correction of inaccurate information Request
              deletion of personal information Opt out of certain marketing
              communications Opt out of the sale of personal information Opt out
              of certain sharing or targeted advertising Limit certain uses of
              sensitive personal information Obtain information about
              Brixlore&apos;s privacy practices. Certain rights are subject to
              applicable legal exceptions and verification requirements. To
              exercise an applicable privacy right, contact Brixlore using the
              contact information provided below. Where required by applicable
              law, Brixlore will provide additional methods for submitting
              privacy requests.
            </p>
          </section>
          <section id="section-12">
            <h2>12 · California Privacy Rights</h2>
            <p>
              California residents may have additional rights under the
              California Consumer Privacy Act (“CCPA”), as amended by the
              California Privacy Rights Act (“CPRA”). Depending on applicable
              law, California residents may have rights concerning access,
              deletion, correction, and opting out of the sale or sharing of
              personal information, among other rights. If Brixlore sells or
              shares personal information in a manner covered by applicable
              California law, California residents may have the right to opt
              out. Brixlore will provide an appropriate mechanism for submitting
              applicable requests, including a mechanism for opting out of the
              sale or sharing of personal information where required. California
              residents may also have rights concerning the use and disclosure
              of sensitive personal information. Brixlore will not discriminate
              against a consumer for exercising privacy rights to the extent
              prohibited by applicable law.
            </p>
          </section>
          <section id="section-13">
            <h2>13 · Do Not Sell or Share My Personal Information</h2>
            <p>
              Where required by applicable law, Brixlore will provide users with
              an accessible mechanism to opt out of the sale or sharing of their
              personal information. When applicable, users may exercise this
              choice through a “Do Not Sell or Share My Personal Information” or
              “Your Privacy Choices” mechanism made available by Brixlore.
              Certain jurisdictions may also recognize browser-based privacy
              signals, including Global Privacy Control, as a valid opt-out
              mechanism. Brixlore will process such signals where required by
              applicable law.
            </p>
          </section>
          <section id="section-14">
            <h2>14 · Children&apos;s Privacy</h2>
            <p>
              Brixlore is intended for adults and its content is designated 18+.
              Brixlore does not knowingly direct the Platform toward children
              under 18. If we learn that we have collected personal information
              from a person under the applicable minimum age without the legally
              required authorization, we may take steps to delete that
              information and terminate the associated account where
              appropriate. Parents or guardians who believe a minor has provided
              personal information to Brixlore may contact us using the
              information below.
            </p>
          </section>
          <section id="section-15">
            <h2>15 · Third-Party Services and Links</h2>
            <p>
              The Platform may contain links, integrations, advertisements, or
              connections to third-party websites, applications, services, or
              platforms. Brixlore is not responsible for the privacy practices
              of third parties. Your interactions with third-party services are
              governed by the privacy policies and terms of those third parties.
            </p>
          </section>
          <section id="section-16">
            <h2>16 · International Users</h2>
            <p>
              Brixlore may operate and use service providers located in the
              United States and other jurisdictions. If you access Brixlore from
              outside the United States, your information may be transferred to,
              stored in, or processed in jurisdictions that may have different
              privacy laws from those in your country or region.
            </p>
          </section>
          <section id="section-17">
            <h2>17 · Changes to This Privacy Policy</h2>
            <p>
              Brixlore may update this Privacy Policy from time to time.
              Additional contact information and privacy-request procedures may
              be provided through the When we make changes, we may update the
              Effective Date at the top of this policy and provide additional
              notice when required by applicable law. Your continued use of the
              Platform after an updated Privacy Policy becomes effective
              constitutes your acknowledgment of the updated policy to the
              extent permitted by law.
            </p>
          </section>
          <section id="section-18">
            <h2>18 · Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, your personal
              information, or your privacy choices, you may contact:
            </p>
            <p>
              Brixlore LLC
              <br />
              Privacy Contact: support@brixlore.tv
              <br />
              Website: Brixlore.tv
              <br />
              Platform.
            </p>
          </section>
          <footer className="border-t border-black/10 pt-8 text-sm text-black/50">
            Brixlore LLC
            <br />
            Privacy Policy — Effective April 13th, 2026
          </footer>
        </article>
      </div>
    </main>
  );
}

export default Page;
