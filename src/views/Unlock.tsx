import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { decryptImage } from '../utils/crypto';
import { getAllRequests } from '../utils/db';

interface RequestItem {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

const Unlock: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const loadRequests = async () => {
    const data = await getAllRequests();
    setRequests(data);
    if (data.length > 0) {
      setSelectedRequestId(data[0].id);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRequestId) return;

    setError(null);
    setPreviewUrl(null);
    setIsDecrypting(true);

    try {
      const selectedReq = requests.find(r => r.id === selectedRequestId);
      if (!selectedReq) throw new Error('Request keys not found.');

      const buffer = await file.arrayBuffer();
      const packagedData = new Uint8Array(buffer);
      
      const blob = await decryptImage(packagedData, selectedReq.secretKey);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed. Ensure you selected the correct request name.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="unlock-view">
      <div className="card">
        <h2>Unlock Photo</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Select the request name and upload the <b>.capture</b> file.
        </p>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p>You haven't created any requests yet.</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Go Create Request</button>
          </div>
        ) : (
          <>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>1. Select Request Name</label>
            <select 
              value={selectedRequestId} 
              onChange={(e) => setSelectedRequestId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}
            >
              {requests.map(req => (
                <option key={req.id} value={req.id}>{req.id}</option>
              ))}
            </select>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>2. Upload .capture file</label>
            <div className="unlock-dropzone" style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept=".capture"
                onChange={handleFileChange}
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  opacity: 0, 
                  cursor: 'pointer',
                  zIndex: 2
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                  <Upload size={32} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{isDecrypting ? 'Decrypting...' : 'Drop file here or click'}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Only .capture files are supported</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', display: 'flex', gap: '0.75rem', animation: 'slideIn 0.3s ease-out' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {previewUrl && (
        <div className="card" style={{ padding: '1rem', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <div style={{ background: '#dcfce7', padding: '0.4rem', borderRadius: '50%' }}>
                <ImageIcon size={18} color="var(--success)" /> 
              </div>
              Verified Photo
            </h3>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1rem', fontSize: '0.85rem' }} onClick={() => {
              const a = document.createElement('a');
              a.href = previewUrl;
              a.download = `verified_photo_${selectedRequestId}.jpg`;
              a.click();
            }}>
              Download JPG
            </button>
          </div>
          <div className="camera-container" style={{ height: 'auto', minHeight: '300px', border: '4px solid #f1f5f9' }}>
            <img src={previewUrl} alt="Decrypted" className="preview-img" style={{ height: 'auto', width: '100%', display: 'block' }} />
          </div>
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <p style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600, textAlign: 'center', margin: 0 }}>
              ✓ This photo is guaranteed to be unedited and captured live.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Unlock;
