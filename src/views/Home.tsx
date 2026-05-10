import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Copy, Check } from 'lucide-react';
import { generateKeyPair } from '../utils/crypto';
import { saveRequest, getAllRequests, deleteRequest } from '../utils/db';

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

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const data = await getAllRequests();
    setRequests(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    const keys = generateKeyPair();
    const newRequest: RequestItem = {
      id: newName.trim(),
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
      createdAt: Date.now(),
    };
    
    await saveRequest(newRequest);
    setNewName('');
    loadRequests();
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete request "${id}"? You won't be able to unlock photos for this request if you haven't backed up the key.`)) {
      await deleteRequest(id);
      loadRequests();
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
    </div>
  );
};

export default Home;
