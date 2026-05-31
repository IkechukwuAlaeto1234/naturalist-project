import React from "react";
import type { Metadata } from "next";
import LegalPageShell from "../../components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | Naturalist",
  description: "The terms and conditions governing your use of the Naturalist website and services.",
};

const sections = [
  {
    heading: "1. Acceptance of Terms",
    body: "By accessing or using the Naturalist website (naturalist.com) or placing an order, you agree to be bound by these Terms of Service. If you do not agree, please do not use our site. We reserve the right to update these terms at any time; continued use constitutes acceptance of any changes.",
  },
  {
    heading: "2. Eligibility",
    body: "You must be at least 18 years of age to place an order or create an account on naturalist.com. By using this site, you represent and warrant that you meet this age requirement.",
  },
  {
    heading: "3. Products & Availability",
    body: [
      "All product descriptions, images, and prices are subject to change without notice.",
      "We reserve the right to limit quantities, refuse orders, or discontinue products at any time.",
      "Colours and textures may appear slightly different on screen due to monitor calibration.",
      "Product availability is not guaranteed until your order is confirmed.",
    ],
  },
  {
    heading: "4. Pricing & Payment",
    body: "Prices are listed in USD and are inclusive of applicable taxes where stated. We accept major credit cards, debit cards, and other payment methods displayed at checkout. Payment is processed securely via third-party providers. We reserve the right to cancel any order placed at an incorrectly displayed price.",
  },
  {
    heading: "5. Orders & Cancellations",
    body: "Once an order is placed, you have a 2-hour window to modify or cancel it. After that window, fulfilment may have commenced. Contact us immediately at hello@naturalist.com if you need to make changes. We reserve the right to cancel any order at our discretion, in which case a full refund will be issued.",
  },
  {
    heading: "6. Shipping",
    body: "Delivery timelines are estimates and not guarantees. Naturalist is not responsible for delays caused by carriers, customs processing, or circumstances beyond our control. Risk of loss and title for products purchased pass to you upon delivery to the carrier.",
  },
  {
    heading: "7. Returns & Refunds",
    body: "Returns and refunds are governed by our Refund Policy, which is incorporated into these terms by reference. Please review that policy before placing an order.",
  },
  {
    heading: "8. Intellectual Property",
    body: "All content on naturalist.com — including text, images, logos, product designs, and code — is the property of Naturalist or its licensors and is protected by copyright and trademark law. You may not reproduce, distribute, or create derivative works without prior written permission.",
  },
  {
    heading: "9. User Accounts",
    body: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to notify us immediately of any unauthorised use of your account.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    heading: "10. Prohibited Conduct",
    body: [
      "Using the site for any unlawful purpose or in violation of any applicable regulations.",
      "Attempting to gain unauthorised access to any part of our systems.",
      "Submitting false, misleading, or fraudulent information.",
      "Reselling products purchased from Naturalist without prior written consent.",
    ],
  },
  {
    heading: "11. Disclaimer of Warranties",
    body: "Our website and products are provided on an 'as is' basis. We make no warranties, express or implied, regarding the accuracy, completeness, or fitness for a particular purpose of any content or product. Our skincare products are not intended to diagnose, treat, cure, or prevent any medical condition.",
  },
  {
    heading: "12. Limitation of Liability",
    body: "To the maximum extent permitted by law, Naturalist shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid by you for the specific order giving rise to the claim.",
  },
  {
    heading: "13. Governing Law",
    body: "These Terms of Service are governed by the laws of the State of Oregon, USA, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts of Multnomah County, Oregon.",
  },
  {
    heading: "14. Contact",
    body: "Questions about these Terms? Reach us at hello@naturalist.com or via our contact form.",
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The rules and guidelines that govern your use of Naturalist."
      lastUpdated="31 May 2026"
      sections={sections}
      patternId="termsPattern"
    />
  );
}
