import React from 'react';
import { Mail, Phone, MapPin, Clock3 } from 'lucide-react';

const ContactUs = () => {
  return (
    <main className="px-4 py-10 md:px-8 lg:px-12">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card animate-reveal-up p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Contact Us</p>
          <h1 className="font-display mt-3 text-3xl font-bold md:text-5xl">Talk To The SolarShare Team</h1>
          <p className="mt-4 text-sm leading-7 text-(--ink-700) md:text-base">
            For onboarding support, listing guidance, or partnership discussion, reach out through any channel below.
          </p>

          <div className="mt-7 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-(--line) p-4">
              <Mail className="mt-0.5 text-emerald-600" size={18} />
              <div>
                <h2 className="font-semibold">Email</h2>
                <p className="text-sm text-(--ink-700)">support@solarshare.in</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-(--line) p-4">
              <Phone className="mt-0.5 text-emerald-600" size={18} />
              <div>
                <h2 className="font-semibold">Phone</h2>
                <p className="text-sm text-(--ink-700)">+91 90000 12345</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-(--line) p-4">
              <MapPin className="mt-0.5 text-emerald-600" size={18} />
              <div>
                <h2 className="font-semibold">Address</h2>
                <p className="text-sm text-(--ink-700)">TechnoCoders Hub, Pune, Maharashtra</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="surface-card animate-reveal-up p-8" style={{ animationDelay: '110ms' }}>
          <h2 className="font-display text-2xl font-semibold">Support Hours</h2>
          <p className="mt-2 text-sm text-(--ink-700)">Our support team responds quickly during working hours.</p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-(--line) px-3 py-2">
              <span>Monday - Friday</span>
              <span className="font-semibold">9:30 AM - 6:30 PM</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-(--line) px-3 py-2">
              <span>Saturday</span>
              <span className="font-semibold">10:00 AM - 2:00 PM</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-(--line) px-3 py-2">
              <span>Sunday</span>
              <span className="font-semibold">Closed</span>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Clock3 size={16} /> Average first response time: under 4 business hours.
          </div>
        </aside>
      </section>
    </main>
  );
};

export default ContactUs;
