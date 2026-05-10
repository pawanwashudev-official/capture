import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, RefreshCcw, Check, Share2, Download, AlertCircle } from 'lucide-react';
import { encryptImage } from '../utils/crypto';

const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const publicKey = searchParams.get('k');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      startCamera();
    } else {
      setError('Invalid or missing capture link. Please ask the requester for a new link.');
    }
    
    return () => {
      stopCamera();
    };
  }, [publicKey]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, // Front camera for "selfie" trust
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError('Camera access denied. This app requires camera permission to guarantee a live photo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setPreviewUrl(null);
    setEncryptedData(null);
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedBlob || !publicKey) return;
    
    setIsEncrypting(true);
    try {
      const encrypted = await encryptImage(capturedBlob, publicKey);
      setEncryptedData(encrypted);
    } catch (err) {
      setError('Encryption failed. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleShare = async () => {
    if (!encryptedData) return;
    
    const file = new File([encryptedData.buffer as ArrayBuffer], 'photo.nfcapture', { type: 'application/octet-stream' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Authentic Photo',
          text: 'Here is my unedited photo captured via HonestCapture.',
        });
      } catch (err) {
        // Fallback if sharing is cancelled or fails
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo.nfcapture';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h3>Error</h3>
        <p style={{ color: 'var(--text-light)' }}>{error}</p>
        <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="capture-view">
      {!capturedBlob ? (
        <div className="card" style={{ padding: '1rem' }}>
          <h2>Live Capture</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Position yourself and click Capture.</p>
          
          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
          
          <button className="btn btn-primary" onClick={captureFrame}>
            <Camera size={20} />
            Capture Photo
          </button>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <h2>Review Photo</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Only unedited photos can be shared.</p>
          
          <div className="camera-container">
            {previewUrl && <img src={previewUrl} alt="Preview" className="preview-img" />}
          </div>
          
          {!encryptedData ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={handleRetake} disabled={isEncrypting}>
                <RefreshCcw size={20} />
                Retake
              </button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={isEncrypting}>
                {isEncrypting ? 'Encrypting...' : <><Check size={20} /> Confirm</>}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="badge" style={{ background: '#dcfce7', color: '#166534', marginBottom: '1rem', padding: '0.5rem 1rem' }}>
                <Check size={14} style={{ marginRight: '0.5rem' }} /> Photo Locked Successfully
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={handleShare}>
                  <Share2 size={20} />
                  Share Photo
                </button>
                <button className="btn btn-outline" onClick={handleDownload}>
                  <Download size={20} />
                  Download
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '1rem' }}>
                Send this <b>.nfcapture</b> file to the requester.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Capture;
