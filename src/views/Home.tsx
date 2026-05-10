import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Copy, Check, Download, Upload, ShieldAlert } from 'lucide-react';
import { generateKeyPair } from '../utils/crypto';
import { saveRequest, getAllRequests, deleteRequest, clearAllRequests } from '../utils/db';

interface RequestItem {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

const Home: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [newName, setNewName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests().catch(err => {
      console.error(err);
      setError('Failed to load local data. Please refresh the page.');
    });
  }, []);

  const loadRequests = async () => {
    const data = await getAllRequests();
    setRequests(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleExport = () => {
    try {
      if (requests.length === 0) {
        alert('No requests to export.');
        return;
      }
      const data = JSON.stringify(requests, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfcapture_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export backup.');
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
      alert('Backup restored successfully!');
      e.target.value = ''; // Reset input
    } catch (err) {
      console.error(err);
      alert('Failed to import backup. Ensure it is a valid NFCapture JSON file.');
    }
  };

  const handleClearAll = async () => {
    if (confirm('CRITICAL: This will erase ALL requests and private keys from this browser. This cannot be undone unless you have a backup. Proceed?')) {
      try {
        await clearAllRequests();
        await loadRequests();
        alert('All data erased.');
      } catch (err) {
        console.error(err);
        alert('Failed to erase data.');
      }
    }
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
    if (confirm(`Delete request "${id}"? You won't be able to unlock photos for this request if you haven't backed up the key.`)) {
      try {
        await deleteRequest(id);
        await loadRequests();
      } catch (err) {
        console.error(err);
        alert('Failed to delete request.');
      }
    }
  };

  const getCaptureLink = (publicKey: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    // Using hash for client-side routing and to keep URL as short as possible
    return `${baseUrl}#/capture?k=${encodeURIComponent(publicKey)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="home-view">
      <section className="card">
        <h2>Backup & Restore</h2>
        <p>Transfer your keys to another device or save a backup.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={18} />
            Export Backup
          </button>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2, marginBottom: 0 }}
            />
            <button className="btn btn-outline">
              <Upload size={18} />
              Import Backup
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Create New Request</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Generate a unique link to send to the groom.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="e.g. Rahul's Photo" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            style={{ marginBottom: 0 }}
          />
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleCreate}>
            <Plus size={20} />
            Create
          </button>
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: '1rem' }}>Your Requests</h3>
        {requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No requests yet. Create one above!</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{req.id}</h4>
                  <span className="badge">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ width: 'auto', padding: '0.5rem', color: '#ef4444', borderColor: 'transparent' }}
                  onClick={() => handleDelete(req.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LinkIcon size={14} /> Capture Link:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0.25rem' }}>
                    {getCaptureLink(req.publicKey)}
                  </code>
                  <button 
                    className="btn btn-outline" 
                    style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => copyToClipboard(getCaptureLink(req.publicKey), req.id)}
                  >
                    {copiedId === req.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
      <section className="card" style={{ border: '1px solid #fee2e2' }}>
        <h2 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={24} />
          Danger Zone
        </h2>
        <p>Permanently erase all your private keys and request history.</p>
        <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={handleClearAll}>
          <Trash2 size={18} />
          Erase All Data
        </button>
      </section>
    </div>
  );
};

export default Home;
