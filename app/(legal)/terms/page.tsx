import type { Metadata } from "next";
import { LegalHeader, Section } from "../LegalSection";

export const metadata: Metadata = { title: "Terms of Service", description: "The terms that apply when you shop or sell on PeaNut.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <>
      <LegalHeader title="Terms of Service" updated="17 October 2026" />
      <p>These terms govern your use of PeaNut, an online marketplace operated from Kathmandu, Nepal. By creating an account, placing an order or listing products you agree to them.</p>
      <Section title="1. Your account">
        <p>You must be at least 16 years old and give accurate details. You are responsible for activity on your account and for keeping your password secret. Tell us immediately if you suspect unauthorised use.</p>
        <p>We may suspend or close accounts that break these terms, commit fraud, or abuse other users.</p>
      </Section>
      <Section title="2. Orders and pricing">
        <p>Prices are shown in Nepali rupees (NPR) and include applicable taxes. An order is confirmed when payment is received, or when it is placed for Cash on Delivery. We may cancel an order if an item is out of stock, a price is clearly wrong, or we suspect fraud; any payment taken is refunded in full.</p>
        <p>You can cancel an order from your account until it ships.</p>
      </Section>
      <Section title="3. Payments">
        <p>We accept Khalti, Visa/Mastercard cards (processed by Stripe) and Cash on Delivery. Card and wallet details are handled by those providers; PeaNut never stores your full card number.</p>
      </Section>
      <Section title="4. Delivery">
        <p>Delivery estimates are given at checkout and are not guaranteed. Risk in the goods passes to you on delivery. Please check parcels on arrival and report damage within 48 hours.</p>
      </Section>
      <Section title="5. Returns">
        <p>Returns and refunds are covered by our <a href="/refund-policy" className="underline">Returns &amp; Refunds Policy</a>.</p>
      </Section>
      <Section title="6. Sellers">
        <p>Sellers are independent businesses responsible for the accuracy of their listings, the quality and legality of their products, and dispatching orders on time. PeaNut collects payments on sellers&apos; behalf and pays out sellers&apos; earnings, minus the platform commission, after the payout cycle. We may remove listings or suspend stores that break our policies.</p>
      </Section>
      <Section title="7. Loyalty points and coupons">
        <p>Loyalty points and coupons have no cash value, cannot be transferred, and may be reversed if the order they relate to is cancelled or returned. We may change or end the loyalty program with reasonable notice.</p>
      </Section>
      <Section title="8. Acceptable use">
        <p>Do not misuse the site: no fraudulent orders, fake reviews, scraping, attempts to break security, or listing prohibited or counterfeit goods.</p>
      </Section>
      <Section title="9. Liability">
        <p>To the extent the law allows, PeaNut is not liable for indirect or consequential losses, and our total liability for any order is limited to the amount you paid for it. Nothing in these terms limits rights you have under the Consumer Protection Act, 2075 of Nepal.</p>
      </Section>
      <Section title="10. Changes and governing law">
        <p>We may update these terms; the version on this page applies to orders placed after it is posted. These terms are governed by the laws of Nepal, and disputes fall under the jurisdiction of the courts of Kathmandu.</p>
      </Section>
      <Section title="Contact">
        <p>Questions about these terms: <a href="mailto:support@peanut.com" className="underline">support@peanut.com</a>.</p>
      </Section>
    </>
  );
}
