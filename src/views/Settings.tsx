import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { saveRequest, getAllRequests, clearAllRequests } from '../utils/db';

interface RequestItem {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

const SettingsView: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const loadRequests = async () => {
    try {
      const data = await getAllRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();

    const handleBeforeInstallPrompt = (e: Event | any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };


  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleExport = () => {
    try {
      if (requests.length === 0) {
        showStatus('error', 'No data to export.');
        return;
      }
      const data = JSON.stringify(requests, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capture_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('success', 'Backup exported successfully!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Export failed.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported: RequestItem[] = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      
      for (const req of imported) {
        if (!req.id || !req.publicKey || !req.secretKey) continue;
        await saveRequest(req);
      }
      await loadRequests();
      showStatus('success', 'Backup restored successfully!');
      e.target.value = ''; 
    } catch (err) {
      console.error(err);
      showStatus('error', 'Import failed. Invalid file format.');
    }
  };

  const handleClearAll = async () => {
    if (confirm('CRITICAL: This will erase ALL requests and private keys from this browser. This cannot be undone. Proceed?')) {
      try {
        await clearAllRequests();
        await loadRequests();
        showStatus('success', 'All data has been erased.');
      } catch (err) {
        console.error(err);
        showStatus('error', 'Failed to erase data.');
      }
    }
  };

  return (
    <div className="settings-view">
      <h2>App Settings</h2>
      <p style={{ marginBottom: '2rem' }}>Manage your data and security configurations.</p>

      {status && (
        <div className="card" style={{ 
          background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', 
          border: `1px solid ${status.type === 'success' ? '#dcfce7' : '#fee2e2'}`,
          color: status.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease-out',
          marginBottom: '1.5rem'
        }}>
          {status.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <p style={{ margin: 0, fontWeight: 600 }}>{status.message}</p>
        </div>
      )}

      <section className="card">
        <h3>PWA Installation</h3>
        <p>Install Capture on your home screen for a better camera experience.</p>
        <button 
          className="btn btn-primary" 
          onClick={handleInstall} 
          disabled={!deferredPrompt}
          style={{ marginBottom: '1rem', opacity: deferredPrompt ? 1 : 0.6 }}
        >
          {deferredPrompt ? 'Install Capture App' : 'App Already Installed / Not Supported'}
        </button>
      </section>

      <section className="card">
        <h3>Backup & Restore</h3>
        <p>Transfer your keys to another device or save a secure backup file.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={18} />
            Export Data (.json)
          </button>
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2, marginBottom: 0 }}
            />
            <button className="btn btn-outline" style={{ width: '100%' }}>
              <Upload size={18} />
              Import Data (.json)
            </button>
          </div>
        </div>
      </section>

      <section className="card" style={{ border: '1px solid #fee2e2' }}>
        <h3 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} />
          Danger Zone
        </h3>
        <p>Permanently remove all local data from this browser.</p>
        <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={handleClearAll}>
          <Trash2 size={18} />
          Reset All App Data
        </button>
      </section>
    </div>
  );
};

export default SettingsView;
