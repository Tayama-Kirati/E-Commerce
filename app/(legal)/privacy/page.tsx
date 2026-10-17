import type { Metadata } from "next";
import { LegalHeader, Section } from "../LegalSection";

export const metadata: Metadata = { title: "Privacy Policy", description: "What personal data PeaNut collects, why, and your choices.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader title="Privacy Policy" updated="17 October 2026" />
      <p>This policy explains what personal information PeaNut collects, how we use it, and the choices you have. It is written with the Individual Privacy Act, 2075 of Nepal in mind.</p>
      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account details:</strong> name, email, phone number, password (stored only as a secure hash), and profile photo if you add one.</li>
          <li><strong>Orders:</strong> delivery addresses, items bought, order history, returns and support messages.</li>
          <li><strong>Payments:</strong> payment method and transaction references. Card and wallet details are handled by Stripe and Khalti, not stored by us.</li>
          <li><strong>Usage:</strong> pages viewed, searches and device/browser information, used to keep the site secure and improve it.</li>
          <li><strong>Chat assistant:</strong> messages you send to our AI assistant, which are processed by Anthropic to generate replies.</li>
        </ul>
      </Section>
      <Section title="How we use it">
        <p>To process and deliver orders, take payments, provide support, prevent fraud, send order and account emails or SMS, run the loyalty program, and — only if you agree — send marketing.</p>
      </Section>
      <Section title="Who we share it with">
        <p>Sellers receive the name, phone and address needed to fulfil your order. We also use service providers: payment processors (Khalti, Stripe), delivery partners, email (Resend), SMS (Sparrow SMS), image hosting (Cloudinary), hosting/database providers, and Anthropic for the chat assistant. They may only use the data to provide their service to us. We do not sell your personal information.</p>
      </Section>
      <Section title="How long we keep it">
        <p>Account data is kept while your account is open. Order and payment records are kept for as long as tax and accounting law requires, even after an account is closed.</p>
      </Section>
      <Section title="Your choices and rights">
        <p>You can update your profile and addresses at any time from your account. You can ask us for a copy of your data, to correct it, or to close your account and delete what we are not required to keep, by emailing <a href="mailto:support@peanut.com" className="underline">support@peanut.com</a>.</p>
      </Section>
      <Section title="Cookies">
        <p>We use essential cookies to keep you signed in and secure checkout, and your browser&apos;s local storage to remember your cart and preferences.</p>
      </Section>
      <Section title="Security">
        <p>Data is sent over encrypted connections, passwords are hashed, and access to personal data is limited to staff who need it.</p>
      </Section>
      <Section title="Changes">
        <p>If we change this policy in a meaningful way we will notify you by email or on the site.</p>
      </Section>
    </>
  );
}
