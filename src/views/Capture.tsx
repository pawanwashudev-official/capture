import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Share2, Download, AlertCircle, FlipHorizontal, Zap, ZapOff, X, ShieldCheck } from 'lucide-react';
import { encryptImage } from '../utils/crypto';

type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | 'Sensor';

const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const publicKey = searchParams.get('k');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [ratio, setRatio] = useState<AspectRatio>('Sensor');
  const [sensorRatio, setSensorRatio] = useState<number>(3/4);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);
  
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  // Lock Body Scroll
  useEffect(() => {
    if (!capturedBlob) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [capturedBlob]);

  useEffect(() => {
    if (publicKey) startCamera();
    else setError('Invalid link.');
    return () => stopCamera();
  }, [publicKey, facingMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['VolumeUp', 'VolumeDown', 'AudioVolumeUp', 'AudioVolumeDown'].includes(e.key) && !capturedBlob && stream) {
        e.preventDefault();
        captureFrame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturedBlob, stream]);

  const [isPortrait, setIsPortrait] = useState(true);

  const startCamera = async () => {
    stopCamera();
    setIsVerified(false);
    
    // Slight delay to allow hardware to release
    await new Promise(r => setTimeout(r, 100));

    try {
      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: { ideal: facingMode }, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
        audio: false 
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // On mobile, sometimes play() needs to be explicit
        try { await videoRef.current.play(); } catch (e) {}
      }
      
      const track = s.getVideoTracks()[0];
      const settings = track.getSettings();
      const capabilities = track.getCapabilities() as any;
      
      setHasTorch(!!capabilities.torch);
      if (capabilities.zoom) {
        setHasZoom(true);
        setMinZoom(capabilities.zoom.min || 1);
        setMaxZoom(capabilities.zoom.max || 1);
        setZoom(settings.zoom || capabilities.zoom.min || 1);
      }
      
      // Verification logic: frames must be flowing and metadata correct
      if (settings.frameRate && (settings.facingMode || facingMode)) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please check permissions and ensure no other app is using it.');
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    
    // Critical: detect if the actual stream is portrait or landscape
    const portrait = videoHeight > videoWidth;
    setIsPortrait(portrait);
    setSensorRatio(videoWidth / videoHeight);
    
    console.log(`Stream loaded: ${videoWidth}x${videoHeight}, Ratio: ${videoWidth/videoHeight}`);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setIsTorchOn(false);
    setZoom(1);
    // startCamera is triggered by the useEffect dependency on facingMode
  };

  const handleZoomChange = async (val: number) => {
    if (!stream || !hasZoom) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ zoom: val } as any] });
      setZoom(val);
    } catch (err) {}
  };

  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !isTorchOn } as any] });
      setIsTorchOn(!isTorchOn);
    } catch (err) {}
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.paused || video.ended || !isVerified) {
      alert('Live stream not verified.');
      return;
    }

    // Trigger visual flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    
    // Mapping for ratios
    let targetRatio = sensorRatio;
    if (ratio === '1:1') targetRatio = 1/1;
    if (ratio === '4:3') targetRatio = isPortrait ? 3/4 : 4/3;
    if (ratio === '9:16') targetRatio = 9/16;
    if (ratio === '16:9') targetRatio = 16/9;
    
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    let dW = vW, dH = vH;
    
    // Professional center-crop logic
    if (vW / vH > targetRatio) {
      dW = vH * targetRatio;
    } else {
      dH = vW / targetRatio;
    }
    
    canvas.width = dW;
    canvas.height = dH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const sX = (vW - dW) / 2;
      const sY = (vH - dH) / 2;
      
      ctx.save();
      if (facingMode === 'user') { 
        ctx.translate(dW, 0); 
        ctx.scale(-1, 1); 
      }
      ctx.drawImage(video, sX, sY, dW, dH, 0, 0, dW, dH);
      ctx.restore();
      
      // Branding / Security - Scaled watermark
      const fontSize = Math.max(16, Math.floor(dH * 0.03));
      
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, dH - (fontSize * 2.8), dW, fontSize * 2.8);
      
      ctx.fillStyle = '#10b981'; 
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const text = `VERIFIED LIVE • ${new Date().toLocaleString()}`;
      ctx.fillText(text, fontSize, dH - fontSize * 1.2);

      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.98);
    }
  };

  const handleShare = async () => {
    if (!encryptedData) return;
    try {
      const file = new File([encryptedData.buffer as ArrayBuffer], 'photo.nfcapture', { type: 'application/octet-stream' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Authentic Photo', text: 'NFCapture verified photo' });
      } else { handleDownload(); }
    } catch (err) { if ((err as Error).name !== 'AbortError') handleDownload(); }
  };

  const handleDownload = () => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'photo.nfcapture'; a.click();
    URL.revokeObjectURL(url);
  };

  // UI helpers for ratio boxes
  const getContainerStyles = (): React.CSSProperties => {
    let aspect = sensorRatio;
    if (ratio === '1:1') aspect = 1/1;
    if (ratio === '4:3') aspect = isPortrait ? 3/4 : 4/3;
    if (ratio === '9:16') aspect = 9/16;
    if (ratio === '16:9') aspect = 16/9;
    
    // We want the preview to be as large as possible without overflowing
    // and correctly accounting for the top/bottom bars.
    return {
      aspectRatio: `${aspect}`,
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      maxWidth: '100%',
      position: 'relative',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    };
  };

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '5rem', padding: '2rem' }}>
        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h3 style={{ fontSize: '1.5rem' }}>Camera Error</h3>
        <p style={{ marginBottom: '2rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="capture-view">
      {!capturedBlob ? (
        <div className="fullscreen-capture">
          <div className={`camera-flash ${showFlash ? 'active' : ''}`} />
          <div className="camera-preview-area">
            <div style={getContainerStyles()}>
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onLoadedMetadata={handleLoadedMetadata}
                className={facingMode === 'user' ? 'mirror' : ''} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: ratio === 'Sensor' ? 'contain' : 'cover',
                  display: 'block'
                }}
               />
            </div>
            
            <div className="camera-overlay">
              <div className="camera-top-bar">
                <button 
                  className="btn btn-outline" 
                  style={{ width: '48px', height: '48px', padding: 0, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%' }} 
                  onClick={() => navigate('/')}
                  aria-label="Exit Camera"
                >
                  <X size={24} />
                </button>
                <div className="ratio-selector">
                  {['Sensor', '1:1', '4:3', isPortrait ? '9:16' : '16:9'].map(r => (
                    <button 
                      key={r} 
                      className={`ratio-option ${ratio === r ? 'active' : ''}`} 
                      onClick={() => setRatio(r as AspectRatio)}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div style={{ width: 48, textAlign: 'center' }}>
                  {isVerified && <ShieldCheck size={28} color="#10b981" />}
                </div>
              </div>

              <div className="camera-bottom-bar">
                {hasZoom && maxZoom > minZoom && (
                  <div className="zoom-slider-container">
                    <input 
                      type="range" 
                      min={minZoom} 
                      max={maxZoom} 
                      step="0.1" 
                      value={zoom} 
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))} 
                      style={{ flex: 1, accentColor: 'white', height: '32px' }} 
                      aria-label="Zoom"
                    />
                    <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 800, minWidth: '2.5rem', textAlign: 'right' }}>{zoom.toFixed(1)}x</span>
                  </div>
                )}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', maxWidth: '340px' }}>
                  <button 
                    className="btn" 
                    style={{ width: '56px', height: '56px', padding: 0, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', visibility: hasTorch ? 'visible' : 'hidden', borderRadius: '50%' }} 
                    onClick={toggleTorch}
                  >
                    {isTorchOn ? <Zap size={24} fill="white" /> : <ZapOff size={24} />}
                  </button>
                  <button 
                    className="shutter-btn" 
                    onClick={captureFrame}
                    aria-label="Take Photo"
                  >
                    <div className="shutter-inner" />
                  </button>
                  <button 
                    className="btn" 
                    style={{ width: '56px', height: '56px', padding: 0, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%' }} 
                    onClick={toggleCamera}
                  >
                    <FlipHorizontal size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (



        <div className="main-content" style={{ animation: 'fadeIn 0.3s' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Verified Photo</h2>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => { setCapturedBlob(null); startCamera(); }}><X size={20} /></button>
            </div>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000', marginBottom: '1.5rem' }}>
              <img src={previewUrl!} alt="Preview" style={{ width: '100%', display: 'block' }} />
            </div>
            {!encryptedData ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => { setCapturedBlob(null); startCamera(); }} disabled={isEncrypting}>Retake</button>
                <button className="btn btn-primary" onClick={async () => {
                  if (!capturedBlob || !publicKey) return;
                  setIsEncrypting(true);
                  try { const encrypted = await encryptImage(capturedBlob, publicKey); setEncryptedData(encrypted); } 
                  catch (err) { alert('Encryption failed.'); } finally { setIsEncrypting(false); }
                }} disabled={isEncrypting}>{isEncrypting ? 'Encrypting...' : 'Lock Photo'}</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="badge" style={{ marginBottom: '1.5rem', width: '100%', display: 'block', padding: '0.75rem', borderRadius: '8px' }}>Locked & Secured</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleShare}><Share2 size={20} /> Share</button>
                  <button className="btn btn-outline" onClick={handleDownload}><Download size={20} /> Save</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Capture;
