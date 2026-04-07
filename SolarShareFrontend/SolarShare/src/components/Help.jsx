import React from 'react';
import { CircleHelp, Building2, Factory, MessageSquareText } from 'lucide-react';

const faqs = [
  {
    q: 'How does SolarShare help rooftop owners?',
    a: 'Owners can list rooftops, receive interest from installers, and monitor opportunities in one place.'
  },
  {
    q: 'Who can sign up as a solar company?',
    a: 'Any eligible installer or energy developer looking for commercial or industrial rooftop opportunities.'
  },
  {
    q: 'Is there a listing review process?',
    a: 'Yes. We apply validation checks so projects shown in the marketplace are reliable and decision-ready.'
  },
  {
    q: 'Can I manage multiple rooftops?',
    a: 'Yes. Homeowners and organizations can manage multiple listings and engagement history from the dashboard.'
  }
];

const Help = () => {
  return (
    <main className="px-4 py-10 md:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl animate-reveal-up">
        <div className="surface-card p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CircleHelp size={14} /> Help Center
          </div>
          <h1 className="font-display mt-4 text-3xl font-bold md:text-5xl">Answers For Faster Onboarding</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-(--ink-700) md:text-base">
            Use this page for quick guidance on accounts, listing flow, and project matching.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-(--line) p-4">
              <Building2 className="text-emerald-600" size={20} />
              <p className="mt-2 text-sm font-medium">Rooftop owners: create and manage listings.</p>
            </div>
            <div className="rounded-2xl border border-(--line) p-4">
              <Factory className="text-emerald-600" size={20} />
              <p className="mt-2 text-sm font-medium">Solar teams: browse projects and express interest.</p>
            </div>
            <div className="rounded-2xl border border-(--line) p-4">
              <MessageSquareText className="text-emerald-600" size={20} />
              <p className="mt-2 text-sm font-medium">Need support: use Contact Us for direct assistance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl space-y-4">
        {faqs.map((item, index) => (
          <article
            key={item.q}
            className="surface-card animate-reveal-up p-5"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <h2 className="font-display text-lg font-semibold">{item.q}</h2>
            <p className="mt-1 text-sm leading-6 text-(--ink-700)">{item.a}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Help;
