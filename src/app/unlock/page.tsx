"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Key, Image as ImageIcon, ChevronLeft, ShieldCheck, XCircle } from 'lucide-react';
import { decryptImage } from '@/utils/crypto';
import { getAllRequests } from '@/utils/db';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Unlock = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<{id: string, secretKey: string}[]>([]);
  const [selectedReq, setSelectedReq] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const data = await getAllRequests();
    const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
    setRequests(sorted);
    if (sorted.length > 0) setSelectedReq(sorted[0].id);
  };

  const handleUnlock = async () => {
    if (!file || !selectedReq) return;
    setLoading(true);
    setError('');

    try {
      const req = requests.find(r => r.id === selectedReq);
      if (!req) throw new Error('Request keys not found');

      const arrayBuffer = await file.arrayBuffer();
      const decryptedBlob = await decryptImage(new Uint8Array(arrayBuffer), req.secretKey);

      if (!decryptedBlob) throw new Error('Decryption failed. Incorrect file or key.');

      setDecryptedUrl(URL.createObjectURL(decryptedBlob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Decryption failed. Invalid file or key.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!decryptedUrl) return;
    const a = document.createElement('a');
    a.href = decryptedUrl;
    a.download = `verified_${selectedReq}_${Date.now()}.jpg`;
    a.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.capture')) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Please select a valid .capture file.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-foreground m-0">Unlock Photo</h2>
      </div>

      <AnimatePresence mode="wait">
        {!decryptedUrl ? (
          <motion.section
            key="unlock-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card"
          >
            <p className="text-muted-foreground mb-6">
              Select the request name and upload the <b className="text-foreground">.capture</b> file.
            </p>

            <div className="flex flex-col gap-6">
              <div className="p-5 bg-background/50 rounded-2xl border border-border/50">
                <label className="flex items-center gap-2 mb-3 font-bold text-foreground">
                  <Key size={18} className="text-primary" /> 1. Select Key
                </label>
                {requests.length === 0 ? (
                  <p className="text-destructive text-sm font-medium m-0 flex items-center gap-2 bg-destructive/10 p-3 rounded-xl">
                    <XCircle size={16} /> No local keys found. Create a request first.
                  </p>
                ) : (
                  <select
                    className="glass-input cursor-pointer font-medium"
                    value={selectedReq}
                    onChange={e => setSelectedReq(e.target.value)}
                  >
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>{r.id}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-5 bg-background/50 rounded-2xl border border-border/50">
                <label className="flex items-center gap-2 mb-3 font-bold text-foreground">
                  <Upload size={18} className="text-primary" /> 2. Upload .capture file
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".capture"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  onClick={handleFileClick}
                >
                  <div className={`p-3 rounded-full ${file ? 'bg-primary text-primary-foreground' : 'bg-black/5 dark:bg-white/10 text-muted-foreground'}`}>
                    <ImageIcon size={28} />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-bold text-primary m-0 mb-1">{file.name}</p>
                      <p className="text-xs text-muted-foreground m-0">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-foreground m-0 mb-1">Tap to browse</p>
                      <p className="text-xs text-muted-foreground m-0">Only .capture files are supported</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-start gap-3 font-medium text-sm">
                  <XCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="m-0">{error}</p>
                </div>
              )}

              <button
                className={`glass-btn-primary mt-2 ${(!file || !selectedReq) ? 'opacity-50 cursor-not-allowed hover:bg-primary hover:scale-100' : ''}`}
                onClick={handleUnlock}
                disabled={!file || !selectedReq || loading}
              >
                {loading ? 'Decrypting...' : 'Unlock Photo'}
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="unlocked-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm border border-green-500/20">
                <ShieldCheck size={18} /> Verified Authentic
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg border border-border mb-6 bg-black/5">
              <img src={decryptedUrl} alt="Decrypted" className="w-full h-auto block" />
            </div>

            <div className="flex flex-col gap-3">
              <button className="glass-btn-primary" onClick={downloadImage}>
                <Download size={20} /> Download Photo
              </button>
              <button
                className="glass-btn border border-border text-foreground font-semibold"
                onClick={() => {
                  setDecryptedUrl(null);
                  setFile(null);
                }}
              >
                Unlock Another
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Unlock;