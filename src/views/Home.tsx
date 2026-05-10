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
    if (confirm(`Delete request "${id}"? You won't be able to unlock photos for this request without a backup.`)) {
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
        <h2>Create Request</h2>
        <p>Send a secure link to get an unedited photo.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="e.g. Groom's Name" 
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
        <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>Recent Requests</h3>
        {requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ margin: 0 }}>No requests yet. Create one above to get started.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{req.id}</h4>
                  <span className="badge">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ width: 'auto', padding: '0.5rem', color: '#ef4444', border: 'none', boxShadow: 'none' }}
                  onClick={() => handleDelete(req.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LinkIcon size={14} /> Sharable Link
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-light)' }}>
                    {getCaptureLink(req.publicKey)}
                  </code>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => copyToClipboard(getCaptureLink(req.publicKey), req.id)}
                  >
                    {copiedId === req.id ? <Check size={14} /> : <><Copy size={14} /> Copy</>}
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
