import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Leaf, Building2, Gauge, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.jpeg';
import img1 from '../assets/img1.jpeg';
import impactImg from '../assets/impact.png';

const stats = [
  { value: '500+', label: 'Verified rooftops' },
  { value: '50 MW+', label: 'Potential capacity' },
  { value: '2.5 Cr+', label: 'Revenue unlocked' },
  { value: '98%', label: 'Partner satisfaction' }
];

const featureCards = [
  {
    icon: Building2,
    title: 'Rooftop Discovery',
    text: 'Browse high-quality listings with location and project context.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Data',
    text: 'Structured checks improve reliability for both owners and installers.'
  },
  {
    icon: Gauge,
    title: 'Faster Pipeline',
    text: 'Reduce cycle time from listing to project engagement.'
  },
  {
    icon: Leaf,
    title: 'Greener Output',
    text: 'Scale renewable adoption by using underutilized rooftop space.'
  }
];

const MainPage = () => {
  return (
    <main className="px-4 pb-14 pt-8 md:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <div className="surface-card overflow-hidden p-7 md:p-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SolarShare logo" className="h-11 w-11 rounded-xl object-cover" />
            <span className="font-display text-xl font-bold md:text-2xl">SolarShare</span>
          </div>

          <div className="mt-7 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-reveal-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Clean Energy Marketplace</p>
              <h1 className="font-display mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
                Turn Idle Rooftops Into Reliable Energy Assets
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-(--ink-700) md:text-base">
                SolarShare helps rooftop owners and solar companies connect quickly through a trusted, practical,
                and execution-focused platform.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup" className="btn-primary">
                  Start Free <ArrowRight size={16} className="ml-1" />
                </Link>
                <Link to="/about" className="btn-secondary">
                  Learn More
                </Link>
              </div>
              <ul className="mt-3 grid gap-2 text-sm">
                {['Transparent listing process', 'No complex onboarding', 'Designed for scale'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-(--ink-700)">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              
            </div>

            <div className="animate-reveal-up" style={{ animationDelay: '90ms' }}>
              <div className="hero-grid">
                {stats.map((stat, index) => (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-(--line) bg-(--paper) p-5"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <p className="font-display text-3xl font-bold text-emerald-600">{stat.value}</p>
                    <p className="mt-1 text-sm text-(--ink-700)">{stat.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-card animate-reveal-up overflow-hidden">
          <img src={img1} alt="Industrial rooftop with solar panels" className="h-full min-h-64 w-full object-cover" />
        </div>

        <div className="surface-card animate-reveal-up p-6 md:p-8" style={{ animationDelay: '90ms' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">How It Works</p>
          <h2 className="font-display mt-2 text-2xl font-bold md:text-3xl">Simple Flow, Better Matches</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {featureCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-(--line) p-4">
                <card.icon size={18} className="text-emerald-600" />
                <h3 className="font-display mt-2 text-base font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm leading-6 text-(--ink-700)">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card animate-reveal-up p-7 md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Impact</p>
          <h2 className="font-display mt-2 text-2xl font-bold md:text-3xl">Built For Economic And Environmental Gains</h2>
          <p className="mt-3 text-sm leading-7 text-(--ink-700) md:text-base">
            Every rooftop activation helps reduce emissions while generating long-term value for owners and project
            developers. SolarShare turns opportunity into measurable impact.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-secondary">Contact Us</Link>
            <Link to="/help" className="btn-primary">Get Help</Link>
          </div>
        </div>

        <div className="surface-card animate-reveal-up overflow-hidden" style={{ animationDelay: '90ms' }}>
          <img src={impactImg} alt="Clean energy impact illustration" className="h-full min-h-64 w-full object-cover" />
        </div>
      </section>
    </main>
  );
};

export default MainPage;
