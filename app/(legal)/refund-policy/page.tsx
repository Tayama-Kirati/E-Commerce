import type { Metadata } from "next";
import { getSettings } from "@/app/lib/settings";
import { LegalHeader, Section } from "../LegalSection";

export const metadata: Metadata = { title: "Returns & Refunds", description: "How to cancel, return and get refunds on PeaNut orders.", alternates: { canonical: "/refund-policy" } };

// The return window comes from the admin settings
export const revalidate = 300;

export default async function RefundPolicyPage() {
  const { returnWindowDays } = await getSettings();
  return (
    <>
      <LegalHeader title="Returns & Refunds Policy" updated="17 October 2026" />
      <Section title="Cancelling an order">
        <p>You can cancel from <strong>My Orders</strong> at any time before the order ships. Online payments are refunded in full to the original method; any loyalty points you used are returned to your account.</p>
      </Section>
      <Section title={`Returns within ${returnWindowDays} days`}>
        <p>You can request a return within <strong>{returnWindowDays} days of delivery</strong> from the order page if an item is wrong, damaged, defective, missing parts, or not as described. Change-of-mind returns are accepted for unused items in their original packaging.</p>
        <p>Not returnable: perishable goods, personal-care items once opened, underwear and swimwear, and digital products or gift cards.</p>
      </Section>
      <Section title="How it works">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the order in <strong>My Orders</strong> and choose <strong>Request return</strong>. Add photos if the item is damaged.</li>
          <li>We review requests within 2 business days and let you know by email and notification.</li>
          <li>If approved, our courier collects the item. Keep it in its original packaging with all accessories.</li>
          <li>Once we receive and check it, we issue your refund.</li>
        </ol>
      </Section>
      <Section title="Refunds">
        <p>Refunds go to the original payment method: cards in 5–10 business days, Khalti in 3–7 business days. Cash on Delivery orders are refunded to your Khalti wallet or bank account. Shipping fees are refunded when the return is due to our or the seller&apos;s error.</p>
        <p>Loyalty points earned on a returned item are deducted, and coupons used on the order are not reissued.</p>
      </Section>
      <Section title="Need help?">
        <p>Contact <a href="mailto:support@peanut.com" className="underline">support@peanut.com</a> or open a ticket from Customer Care.</p>
      </Section>
    </>
  );
}
