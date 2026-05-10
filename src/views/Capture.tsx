import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, RefreshCcw, Check, Share2, Download, AlertCircle, FlipHorizontal, Zap, ZapOff } from 'lucide-react';
import { encryptImage } from '../utils/crypto';

type AspectRatio = '1-1' | '4-3' | '16-9';

const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const publicKey = searchParams.get('k');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [ratio, setRatio] = useState<AspectRatio>('1-1');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
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

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      };
      
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }

      // Check for torch capability
      const track = s.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      setHasTorch(!!capabilities.torch);
      
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
    
    // Determine capture dimensions based on current ratio
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
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
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop
      const startX = (video.videoWidth - targetWidth) / 2;
      const startY = (video.videoHeight - targetHeight) / 2;
      
      ctx.drawImage(video, startX, startY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      
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
    const file = new File([encryptedData.buffer as ArrayBuffer], 'photo.nfcapture', { type: 'application/octet-stream' });
    if (navigator.share) {
      try {
        await navigator.share({ files: [file], title: 'Authentic Photo', text: 'NFCapture: Verified Unedited Photo' });
      } catch (err) {
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
        <>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Pro Camera</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {hasTorch && (
                  <button className={`control-btn ${isTorchOn ? 'active' : ''}`} onClick={toggleTorch}>
                    {isTorchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                  </button>
                )}
                <button className="control-btn" onClick={toggleCamera}>
                  <FlipHorizontal size={20} />
                </button>
              </div>
            </div>

            <div className={`camera-container ratio-${ratio}`}>
              <video ref={videoRef} autoPlay playsInline muted />
            </div>

            <div className="camera-controls">
              <button className={`btn btn-outline ${ratio === '1-1' ? 'active' : ''}`} style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setRatio('1-1')}>1:1</button>
              <button className={`btn btn-outline ${ratio === '4-3' ? 'active' : ''}`} style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setRatio('4-3')}>4:3</button>
              <button className={`btn btn-outline ${ratio === '16-9' ? 'active' : ''}`} style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setRatio('16-9')}>16:9</button>
            </div>
            
            <button className="btn btn-primary" onClick={captureFrame} style={{ padding: '1.2rem' }}>
              <Camera size={28} />
              Take Photo
            </button>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <h2>Review</h2>
          <div className={`camera-container ratio-${ratio}`}>
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
              <div className="badge" style={{ marginBottom: '1.5rem', background: '#dcfce7', color: '#166534' }}>
                <Check size={14} style={{ marginRight: '0.5rem' }} /> Ready to Share
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={handleShare}>
                  <Share2 size={20} />
                  Share
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
