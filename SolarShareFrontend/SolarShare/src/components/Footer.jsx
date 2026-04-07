import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import logo from '../assets/logo.jpeg';

const Footer = () => {
  const links = [
    { to: '/about', label: 'About Us' },
    { to: '/help', label: 'Help' },
    { to: '/contact', label: 'Contact Us' }
  ];

  return (
    <footer className="border-t border-(--line) bg-(--paper-strong)">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SolarShare logo" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <p className="font-display text-lg font-bold">SolarShare</p>
            <p className="text-xs text-(--ink-700)">Powering practical clean energy growth</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-(--ink-700) transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-(--line) px-3 py-1.5 text-xs">
          <span>Built for Energy</span>
          <Heart size={12} className="fill-emerald-500 text-emerald-500" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
