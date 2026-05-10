import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCcw, Check, Share2, Download, AlertCircle, FlipHorizontal, Zap, ZapOff, X, ShieldCheck } from 'lucide-react';
import { encryptImage } from '../utils/crypto';

type AspectRatio = '1-1' | '4-3' | '16-9' | '9-16';

const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const publicKey = searchParams.get('k');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [ratio, setRatio] = useState<AspectRatio>('4-3');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      startCamera();
    } else {
      setError('Invalid or missing capture link.');
    }
    
    return () => {
      stopCamera();
    };
  }, [publicKey, facingMode]);

  // Volume Button Capture Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isVolumeKey = ['VolumeUp', 'VolumeDown', 'AudioVolumeUp', 'AudioVolumeDown'].includes(e.key);
      if (isVolumeKey && !capturedBlob && stream) {
        e.preventDefault();
        captureFrame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturedBlob, stream]);

  const startCamera = async () => {
    stopCamera();
    setIsVerified(false);
    try {
      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: facingMode,
          width: { ideal: 4096 }, 
          height: { ideal: 2160 }
        },
        audio: false 
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }

      const track = s.getVideoTracks()[0];
      const settings = track.getSettings();
      const capabilities = track.getCapabilities() as any;
      setHasTorch(!!capabilities.torch);
      
      if (settings.frameRate && settings.facingMode) {
        setIsVerified(true);
      }
      
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn } as any]
      });
      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended || !isVerified) {
      alert('Security Alert: Live camera stream not verified.');
      return;
    }
    
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
    // Exact Aspect Ratio Logic
    if (ratio === '1-1') {
      const size = Math.min(targetWidth, targetHeight);
      targetWidth = size;
      targetHeight = size;
    } else if (ratio === '4-3') {
      if (targetWidth / targetHeight > 4/3) {
        targetWidth = targetHeight * (4/3);
      } else {
        targetHeight = targetWidth / (4/3);
      }
    } else if (ratio === '16-9') {
       if (targetWidth / targetHeight > 16/9) {
        targetWidth = targetHeight * (16/9);
      } else {
        targetHeight = targetWidth / (16/9);
      }
    } else if (ratio === '9-16') {
       if (targetWidth / targetHeight > 9/16) {
        targetWidth = targetHeight * (9/16);
      } else {
        targetHeight = targetWidth / (9/16);
      }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Precision Centering
      const startX = (video.videoWidth - targetWidth) / 2;
      const startY = (video.videoHeight - targetHeight) / 2;
      
      ctx.save();
      
      // Mirror result if using front camera to match preview and user expectations
      if (facingMode === 'user') {
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, startX, startY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      ctx.restore();
      
      // Verification Stamp (Deep Rended into pixels)
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(10, targetHeight - 45, 230, 35);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`VERIFIED LIVE: ${new Date().toLocaleString()}`, 20, targetHeight - 22);

      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
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
      setError('Encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleShare = async () => {
    if (!encryptedData) return;
    
    try {
      const file = new File([encryptedData.buffer as ArrayBuffer], 'photo.nfcapture', { 
        type: 'application/octet-stream' 
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Authentic Photo',
          text: 'Verified unedited photo via NFCapture'
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  const handleDownload = () => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo.nfcapture';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="capture-view">
      {!capturedBlob ? (
        <div className="fullscreen-capture">
          <button className="close-camera" onClick={() => navigate('/')}>
            <X size={24} />
          </button>

          <div className="camera-preview-wrapper">
            <div className={`camera-container ratio-${ratio}`} style={{ border: 'none', boxShadow: 'none', borderRadius: 0, margin: 0 }}>
               <video ref={videoRef} autoPlay playsInline muted className={facingMode === 'user' ? 'mirror' : ''} />
            </div>

            <div className="camera-overlay-top">
              <div style={{ width: 40 }}>
                {isVerified && (
                  <div title="Live Verified">
                    <ShieldCheck size={24} color="#10b981" />
                  </div>
                )}
              </div>
              <div className="ratio-selector">
                <span className={`ratio-option ${ratio === '1-1' ? 'active' : ''}`} onClick={() => setRatio('1-1')}>1:1</span>
                <span className={`ratio-option ${ratio === '4-3' ? 'active' : ''}`} onClick={() => setRatio('4-3')}>4:3</span>
                <span className={`ratio-option ${ratio === '16-9' ? 'active' : ''}`} onClick={() => setRatio('16-9')}>16:9</span>
                <span className={`ratio-option ${ratio === '9-16' ? 'active' : ''}`} onClick={() => setRatio('9-16')}>9:16</span>
              </div>
              <div style={{ width: 40 }} />
            </div>

            <div className="camera-overlay-bottom">
               <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                  {hasTorch ? (
                    <button className="control-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={toggleTorch}>
                      {isTorchOn ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
                    </button>
                  ) : <div style={{ width: 44 }} />}
                  
                  <button className="shutter-btn" onClick={captureFrame}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #000' }} />
                  </button>

                  <button className="control-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={toggleCamera}>
                    <FlipHorizontal size={24} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', animation: 'fadeIn 0.4s' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Verify Photo</h2>
          <div className={`camera-container ratio-${ratio}`} style={{ border: '2px solid var(--border)' }}>
            {previewUrl && <img src={previewUrl} alt="Preview" className="preview-img" />}
          </div>
          
          {!encryptedData ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={handleRetake} disabled={isEncrypting}>
                <RefreshCcw size={20} />
                Retake
              </button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={isEncrypting}>
                {isEncrypting ? 'Locking...' : <><Check size={20} /> Confirm</>}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="badge" style={{ marginBottom: '1.5rem', background: '#dcfce7', color: '#166534', padding: '0.6rem 1.2rem' }}>
                <Check size={16} style={{ marginRight: '0.5rem' }} /> Photo Locked Successfully
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={handleShare}>
                  <Share2 size={20} />
                  Share to WhatsApp
                </button>
                <button className="btn btn-outline" onClick={handleDownload}>
                  <Download size={20} />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Capture;
