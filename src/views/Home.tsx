import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Copy, Check, Unlock } from 'lucide-react';
import { generateKeyPair } from '../utils/crypto';
import { saveRequest, getAllRequests, deleteRequest } from '../utils/db';
import { useNavigate } from 'react-router-dom';

interface RequestItem {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
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
        <h2 style={{ color: 'var(--text)', marginBottom: '0.25rem', fontWeight: 900 }}>Create Request</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Generate a secure link for the groom.</p>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recipient Name
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="e.g. Rahul Kumar" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              style={{ marginBottom: 0, fontWeight: 600, border: '2px solid #e2e8f0' }}
            />
            <button className="btn btn-primary" style={{ width: 'auto', padding: '0 1.25rem' }} onClick={handleCreate}>
              <Plus size={20} />
              Create
            </button>
          </div>
        </div>
      </section>

      <section className="card" onClick={() => navigate('/unlock')} style={{ cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '12px' }}>
            <Unlock size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>Unlock Photo</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Verify a photo you received.</p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontWeight: 900, color: 'var(--text)', fontSize: '1.1rem' }}>Recent History</h3>
        {requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderStyle: 'dashed' }}>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>Your capture requests will appear here.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>{req.id}</h4>
                  <span className="badge" style={{ marginTop: '0.25rem' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ width: 'auto', padding: '0.5rem', color: '#ef4444', border: 'none', background: 'transparent', boxShadow: 'none' }}
                  onClick={() => handleDelete(req.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.6rem 0', fontWeight: 800, color: 'var(--text)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LinkIcon size={12} color="var(--primary)" /> Sharable Link
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                    {getCaptureLink(req.publicKey)}
                  </code>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '10px' }}
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
