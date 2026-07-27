"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Shield, ShieldCheck, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSettings = pathname === '/settings';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass border-b border-[var(--glass-border)] px-4 py-3"
    >
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Capture Home">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Shield className="text-primary" size={24} />
          </div>
          <h1 className="m-0 text-xl font-black tracking-tight text-foreground">
            Capture
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <a
            href="https://github.com/pawanwashudev-official/Capture"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden sm:block"
            aria-label="GitHub"
          >
            <span>GitHub</span>
          </a>
          {!isSettings ? (
            <Link href="/settings" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <Settings size={20} />
            </Link>
          ) : (
            <Link href="/" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <ShieldCheck size={20} className="text-primary" />
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;