import React from 'react';
import { ShieldCheck, Sprout, Handshake, Target } from 'lucide-react';

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Verified Marketplace',
    text: 'Each rooftop profile is validated so solar companies can plan projects with confidence and less risk.'
  },
  {
    icon: Sprout,
    title: 'Clean Energy Impact',
    text: 'We help businesses convert idle space into productive clean-energy infrastructure across India.'
  },
  {
    icon: Handshake,
    title: 'Fair Partnerships',
    text: 'Owners and installers connect directly through transparent terms and streamlined onboarding.'
  },
  {
    icon: Target,
    title: 'Execution Focus',
    text: 'From listing to project match, SolarShare is built to reduce delays and speed decision making.'
  }
];

const AboutUs = () => {
  return (
    <main className="px-4 py-10 md:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl animate-reveal-up">
        <div className="surface-card overflow-hidden p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">About SolarShare</p>
          <h1 className="font-display mt-3 text-3xl font-bold md:text-5xl">Built To Unlock Rooftop Solar At Scale</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-(--ink-700) md:text-base">
            SolarShare connects rooftop owners and solar companies on one dependable platform. We focus on trust,
            practical workflows, and measurable outcomes so both sides can move from interest to execution faster.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2">
        {pillars.map((pillar, index) => (
          <article
            key={pillar.title}
            className="surface-card animate-reveal-up p-6"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <pillar.icon size={20} />
            </div>
            <h2 className="font-display text-xl font-semibold">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-6 text-(--ink-700)">{pillar.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default AboutUs;
