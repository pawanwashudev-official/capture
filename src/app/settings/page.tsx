"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, ShieldAlert, Smartphone, ChevronLeft, Save, FileUp, AlertTriangle } from 'lucide-react';
import { getAllRequests, saveRequest, clearAllRequests } from '@/utils/db';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const SettingsView = () => {
  const router = useRouter();
  const [keyCount, setKeyCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKeyCount();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const loadKeyCount = async () => {
    const data = await getAllRequests();
    setKeyCount(data.length);
  };

  const exportKeys = async () => {
    const data = await getAllRequests();
    if (data.length === 0) return alert('No keys to export.');

    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capture_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importKeys = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');

      let imported = 0;
      for (const item of data) {
        if (item.id && item.publicKey && item.secretKey) {
          await saveRequest(item);
          imported++;
        }
      }
      alert(`Successfully imported ${imported} keys.`);
      loadKeyCount();
    } catch (err) {
      alert('Failed to import keys. Invalid file format.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const wipeData = async () => {
    if (window.confirm('WARNING: This will delete ALL your local keys. You will not be able to unlock any previously received photos. Proceed?')) {
      if (window.confirm('Are you absolutely sure? Make sure you have exported a backup.')) {
        await clearAllRequests();
        loadKeyCount();
        alert('All local keys have been wiped.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6 pb-12"
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-foreground m-0">Settings</h2>
      </div>

      <section className="glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Save size={24} />
          </div>
          <div>
            <h3 className="m-0 text-lg font-extrabold text-foreground">Backup & Restore</h3>
            <p className="m-0 text-sm text-muted-foreground">{keyCount} local keys stored</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Capture is completely serverless. Your keys are stored only on this device.
          Export a backup before clearing browser data or using a new device.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="glass-btn flex-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold border-none" onClick={exportKeys}>
            <Download size={18} /> Export Keys
          </button>

          <button className="glass-btn flex-1 border border-border font-bold text-foreground" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Import Keys
          </button>
          <input type="file" ref={fileInputRef} accept=".json" onChange={importKeys} className="hidden" />
        </div>
      </section>

      <section className="glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
            <Smartphone size={24} />
          </div>
          <h3 className="m-0 text-lg font-extrabold text-foreground">Install App</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Install Capture on your home screen for a better camera experience.</p>

        <button
          className={`glass-btn-primary w-full ${!deferredPrompt ? 'opacity-50 cursor-not-allowed hover:bg-primary hover:scale-100' : ''}`}
          onClick={installPWA}
          disabled={!deferredPrompt}
        >
          <Download size={18} />
          {deferredPrompt ? 'Install Capture App' : 'App Already Installed / Not Supported'}
        </button>
      </section>

      <section className="glass-card border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-destructive/10 p-2 rounded-xl text-destructive">
            <AlertTriangle size={24} />
          </div>
          <h3 className="m-0 text-lg font-extrabold text-destructive">Danger Zone</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Wipe all local keys. This action cannot be undone unless you have a backup.</p>

        <button
          className="glass-btn w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold border-none"
          onClick={wipeData}
        >
          <ShieldAlert size={18} /> Wipe All Local Data
        </button>
      </section>
    </motion.div>
  );
};

export default SettingsView;