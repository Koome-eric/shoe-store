"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Mail, Clock, MapPin, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Enter a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactInput = z.infer<typeof schema>;

const channels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+254 700 000 000",
    note: "Fastest response — Mon–Sat, 8 am–7 pm",
    href: buildWhatsAppLink("Hi! I have a question about Savanna & Sole."),
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@savannasole.co.ke",
    note: "We reply within one business day",
    href: "mailto:hello@savannasole.co.ke",
    external: false,
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Nairobi, Kenya",
    note: "Online store — no walk-in visits",
    href: null,
    external: false,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Sat, 8 am – 7 pm",
    note: "Closed Sundays & public holidays",
    href: null,
    external: false,
  },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: ContactInput) {
    setLoading(true);
    // TODO: wire to a real email/form endpoint (e.g. Resend, Formspree, or a
    //       POST /api/contact route). For now we simulate a 1-second delay.
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success("Message sent! We'll get back to you within one business day.");
    reset();
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-forest text-bone">
        <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-bone/50">
            Get in touch
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-base text-bone/70">
            Questions about an order, sizing help, or just want to say hello —
            we're here. WhatsApp is the quickest way to reach us.
          </p>
        </div>
        <div className="ruler-divider !bg-bone/20" />
      </section>

      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

          {/* ── Contact channels ── */}
          <aside className="space-y-4">
            <h2 className="font-display text-lg font-bold">Ways to reach us</h2>
            <div className="ruler-divider mb-6" />
            {channels.map((c) => {
              const Icon = c.icon;
              const inner = (
                <div className="flex items-start gap-3 rounded-md border border-border bg-bone-deep p-4 text-sm transition-colors hover:border-clay/50">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-clay text-bone">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {c.label}
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">{c.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.note}</p>
                  </div>
                </div>
              );

              if (c.href) {
                return (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    {inner}
                  </a>
                );
              }
              return <div key={c.label}>{inner}</div>;
            })}

            <div className="pt-2">
              <Button className="w-full" asChild>
                <a
                  href={buildWhatsAppLink("Hi! I have a question about Savanna & Sole.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Open WhatsApp
                </a>
              </Button>
            </div>

            <p className="pt-2 text-xs text-muted-foreground">
              For delivery and returns questions, see our{" "}
              <Link href="/delivery-returns" className="text-clay underline-offset-2 hover:underline">
                Delivery &amp; Returns
              </Link>{" "}
              page first — it covers most common queries.
            </p>
          </aside>

          {/* ── Contact form ── */}
          <div>
            <h2 className="font-display text-lg font-bold">Send us a message</h2>
            <div className="ruler-divider mt-3 mb-6" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    className="mt-1.5"
                    placeholder="Wanjiru Kamau"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-clay-light">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-1.5"
                    placeholder="you@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-clay-light">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone number{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="mt-1.5"
                  placeholder="07XX XXX XXX"
                  {...register("phone")}
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  className="mt-1.5"
                  placeholder="e.g. Wrong size delivered, Order #SS-7F3K9D"
                  {...register("subject")}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-clay-light">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  className="mt-1.5 resize-none"
                  placeholder="Tell us what's on your mind…"
                  {...register("message")}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-clay-light">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send message
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-xs text-muted-foreground">
              We aim to respond to all messages within one business day. For
              urgent matters, WhatsApp is much faster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
