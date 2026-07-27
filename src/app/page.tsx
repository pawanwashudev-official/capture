"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Copy, Check, Unlock, ExternalLink, Camera, Send, Mail } from 'lucide-react';
import { generateKeyPair } from '@/utils/crypto';
import { saveRequest, getAllRequests, deleteRequest } from '@/utils/db';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface RequestItem {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

export default function Home() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [newName, setNewName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadRequests().catch(console.error);
  }, []);

  const loadRequests = async () => {
    const data = await getAllRequests();
    setRequests(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      const keys = generateKeyPair();
      const newRequest: RequestItem = {
        id: newName.trim(),
        publicKey: keys.publicKey,
        secretKey: keys.secretKey,
        createdAt: Date.now(),
      };

      await saveRequest(newRequest);
      setNewName('');
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to create request.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Delete request "${id}"? You won't be able to unlock photos for this request without a backup.`)) {
      try {
        await deleteRequest(id);
        await loadRequests();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getCaptureLink = (publicKey: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}capture?k=${encodeURIComponent(publicKey)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <section className="glass-card">
        <h2 className="text-2xl font-black text-foreground mb-1">Create Request</h2>
        <p className="text-muted-foreground mb-6">Generate a secure link for the client.</p>

        <div>
          <label className="block mb-2 font-extrabold text-xs text-primary uppercase tracking-wider">
            Recipient Name
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Rahul Kumar"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="glass-input flex-1 font-semibold"
            />
            <button className="glass-btn-primary whitespace-nowrap" onClick={handleCreate}>
              <Plus size={20} />
              Create
            </button>
          </div>
        </div>
      </section>

      <motion.section
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card bg-primary text-primary-foreground cursor-pointer border-none shadow-lg shadow-primary/20"
        onClick={() => router.push('/unlock')}
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Unlock size={28} className="text-white" />
          </div>
          <div>
            <h2 className="m-0 text-white text-xl font-extrabold">Unlock Photo</h2>
            <p className="m-0 text-white/90 text-sm font-medium">Verify a photo you received.</p>
          </div>
        </div>
      </motion.section>

      <section className="mt-4">
        <h3 className="mb-5 font-black text-foreground text-lg">Recent History</h3>
        {requests.length === 0 ? (
          <div className="glass-card text-center py-12 border-dashed bg-background/30">
            <p className="m-0 text-muted-foreground">Your capture requests will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map((req) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={req.id}
                className="glass-card p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="m-0 text-lg font-extrabold text-foreground">{req.id}</h4>
                    <span className="inline-flex bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase mt-2">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    onClick={() => handleDelete(req.id)}
                    aria-label="Delete request"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border/50">
                  <p className="m-0 mb-3 font-extrabold text-foreground text-xs uppercase flex items-center gap-2">
                    <LinkIcon size={14} className="text-primary" /> Sharable Link
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <code className="flex-1 w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-sm bg-background/50 p-2 rounded-lg border border-border/50">
                      {getCaptureLink(req.publicKey)}
                    </code>
                    <button
                      className="glass-btn-primary w-full sm:w-auto py-2 px-4 text-sm"
                      onClick={() => copyToClipboard(getCaptureLink(req.publicKey), req.id)}
                    >
                      {copiedId === req.id ? <Check size={16} /> : <><Copy size={16} /> Copy</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 pt-8 border-t border-border/50 pb-8">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-primary m-0">Capture</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Restoring trust in photography through serverless end-to-end encryption.</p>
            <div className="flex gap-4 mt-2">
              <a href="https://github.com/pawanwashudev-official/Capture" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><ExternalLink size={20} /></a>
              <a href="https://instagram.com/pawan_washudev" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Camera size={20} /></a>
              <a href="https://t.me/pawanwashudev" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Send size={20} /></a>
              <a href="mailto:pawanwashudev@neubofy.in" className="text-muted-foreground hover:text-primary transition-colors"><Mail size={20} /></a>
            </div>
          </div>
          <div className="md:text-right">
            <p className="font-bold text-foreground m-0">Pawan Washudev</p>
            <p className="text-sm text-muted-foreground m-0 mb-2">Founder @ Neubofy</p>
            <a href="mailto:support@neubofy.in" className="text-sm font-semibold text-primary">support@neubofy.in</a>
          </div>
        </div>
        <div className="mt-12 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Capture. All rights reserved.
        </div>
      </footer>
    </motion.div>
  );
}