import Link from "next/link";
import {
  Truck,
  Clock,
  MapPin,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/utils";

export const metadata = {
  title: "Delivery & Returns | Savanna & Sole",
  description:
    "Everything you need to know about how we deliver across Kenya and our 7-day size exchange policy.",
};

const deliveryZones = [
  {
    zone: "Nairobi CBD & suburbs",
    time: "Same day – 1 business day",
    cost: "KES 200",
  },
  {
    zone: "Nairobi outskirts (Kitengela, Thika, Limuru…)",
    time: "1–2 business days",
    cost: "KES 300",
  },
  {
    zone: "Major towns (Mombasa, Kisumu, Nakuru, Eldoret…)",
    time: "2–3 business days",
    cost: "KES 400",
  },
  {
    zone: "Rest of Kenya",
    time: "3–5 business days",
    cost: "KES 500",
  },
];

export default function DeliveryReturnsPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-forest text-bone">
        <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-bone/50">
            Shipping & Returns
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Delivery &amp; Returns
          </h1>
          <p className="mt-4 text-base text-bone/70">
            We deliver to every corner of Kenya. If a size is off, exchanges are
            simple — no paperwork, no drama.
          </p>
        </div>
        <div className="ruler-divider !bg-bone/20" />
      </section>

      {/* ── Delivery section ── */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-clay text-bone">
            <Truck className="h-5 w-5" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            How delivery works
          </h2>
        </div>
        <div className="ruler-divider mt-4 mb-8" />

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Once your M-Pesa payment is confirmed, we pick, pack, and hand your
            order to a courier within <strong className="text-foreground">2 hours</strong> on
            business days (Mon–Sat, 8 am–6 pm). You'll receive an SMS with
            tracking details as soon as the parcel is collected.
          </p>
          <p>
            Orders placed on Sundays or public holidays are dispatched the
            following business morning.
          </p>
        </div>

        {/* Delivery zones table */}
        <div className="mt-10 overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-3 border-b border-border bg-bone-deep px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span>Zone</span>
            <span>Estimated time</span>
            <span>Fee</span>
          </div>
          {deliveryZones.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 items-center border-b border-border px-4 py-3 text-sm last:border-0 odd:bg-background even:bg-bone-deep"
            >
              <span className="font-medium text-foreground">{row.zone}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0 text-clay" />
                {row.time}
              </span>
              <span className="font-semibold text-clay">{row.cost}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" />
          Delivery fees are calculated at checkout based on the address you
          enter. Remote areas not covered by our standard couriers may incur a
          small additional fee — we'll confirm before charging.
        </p>

        {/* Free delivery callout */}
        <div className="mt-8 flex items-start gap-3 rounded-md border border-ochre/40 bg-ochre/10 px-4 py-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ochre" />
          <p className="text-foreground">
            <strong>Free delivery on orders above KES 10,000.</strong> Discount
            applied automatically at checkout — no code needed.
          </p>
        </div>
      </section>

      {/* ── Returns section ── */}
      <section className="bg-bone-deep">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-clay text-bone">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Exchanges &amp; returns
            </h2>
          </div>
          <div className="ruler-divider mt-4 mb-8" />

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "7-day size exchange",
                body: "Got the wrong size? Let us know within 7 days of delivery. We'll swap it for the right size and arrange collection and re-delivery at no extra cost.",
              },
              {
                title: "Unworn condition",
                body: "Items must be unworn, in their original box, with all tags attached. Shoes that show signs of wear outdoors cannot be exchanged.",
              },
              {
                title: "Faulty items",
                body: "If your pair arrives with a manufacturing defect, we'll replace it or refund you in full — no questions asked. Send us a photo via WhatsApp to get started.",
              },
              {
                title: "No cash refunds on change of mind",
                body: "We don't offer refunds if you simply changed your mind, but we'll always try to find you a pair you love through an exchange.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-md border border-border bg-background p-5"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* How to start an exchange */}
          <div className="mt-10">
            <h3 className="font-display text-lg font-bold">
              How to start an exchange
            </h3>
            <div className="ruler-divider mt-3 mb-6" />
            <ol className="space-y-4 text-sm">
              {[
                "Message us on WhatsApp with your order number and the size you need.",
                "We'll confirm stock and schedule a collection from your address.",
                "Drop the shoes off with our rider (original box, unworn).",
                "Your replacement pair is dispatched the same day we receive the return.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-clay font-mono text-xs font-bold text-bone">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex items-start gap-2 rounded-md border border-border bg-bone-deep px-4 py-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" />
            <p>
              Exchanges are subject to stock availability. If your preferred
              size is unavailable, we'll let you choose an alternative or issue
              store credit.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Still have questions?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our team is on WhatsApp Mon–Sat, 8 am–7 pm.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a
                href={buildWhatsAppLink(
                  "Hi! I have a question about delivery or a return."
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
