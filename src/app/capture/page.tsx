"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Camera, SwitchCamera, Loader, Share, Lock, Download, Maximize2, Zap, ZapOff, CheckCircle2 } from 'lucide-react';
import { encryptImage } from '@/utils/crypto';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const CaptureContent = () => {
  const searchParams = useSearchParams();
  const publicKeyStr = searchParams.get('k');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [encryptedFile, setEncryptedFile] = useState<Uint8Array | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');

  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);

  const [isFlashing, setIsFlashing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!publicKeyStr) {
      setErrorMsg('Invalid or missing key. Please use a valid capture link.');
      setIsSupported(false);
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setLoading(true);
    setErrorMsg('');
    try {
      const constraints = {
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check capabilities
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};

      if ((capabilities as any).torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
        setIsTorchOn(false);
      }

      if ((capabilities as any).zoom) {
        setHasZoom(true);
        setMinZoom(((capabilities as any).zoom as any).min || 1);
        setMaxZoom(((capabilities as any).zoom as any).max || 1);
        setZoom(((capabilities as any).zoom as any).min || 1);
      } else {
        setHasZoom(false);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.name === 'NotAllowedError' ? 'Camera access denied.' : 'Failed to start camera.');
      setIsSupported(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
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

  const getCanvasDimensions = (videoWidth: number, videoHeight: number) => {
    if (aspectRatio === '4:3') {
      const h = videoWidth * (4/3);
      return { w: videoWidth, h: h > videoHeight ? videoHeight : h };
    }
    if (aspectRatio === '1:1') {
      const size = Math.min(videoWidth, videoHeight);
      return { w: size, h: size };
    }
    return { w: videoWidth, h: videoHeight };
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !publicKeyStr) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 400);

    setLoading(true);
    setStatus('Capturing secure photo...');

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const { w, h } = getCanvasDimensions(video.videoWidth, video.videoHeight);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const dx = (video.videoWidth - w) / 2;
    const dy = (video.videoHeight - h) / 2;
    ctx.drawImage(video, dx, dy, w, h, 0, 0, w, h);
    ctx.restore();

    // Add VERIFIED LIVE watermark
    const fontSize = Math.max(16, Math.floor(h * 0.03));
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, h - (fontSize * 2.8), w, fontSize * 2.8);
    ctx.fillStyle = '#10b981';
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const text = `VERIFIED LIVE • ${new Date().toLocaleString()}`;
    ctx.fillText(text, fontSize, h - fontSize * 1.2);

    try {
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', 0.95));
      setStatus('Encrypting end-to-end...');

      const encryptedData = await encryptImage(blob, publicKeyStr);
      setEncryptedFile(encryptedData);
      setStatus('Encrypted successfully!');
      setShowResult(true);
      stopCamera();
    } catch (err) {
      console.error(err);
      setErrorMsg('Encryption failed.');
    } finally {
      setLoading(false);
    }
  };

  const sharePhoto = async () => {
    if (!encryptedFile) return;
    try {
      const file = new File([encryptedFile.buffer as ArrayBuffer], 'photo.capture', { type: 'application/octet-stream' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Authentic Photo', text: 'Capture verified photo' });
      } else {
        downloadPhoto();
      }
    } catch (err) {
      console.error(err);
      downloadPhoto();
    }
  };

  const downloadPhoto = () => {
    if (!encryptedFile) return;
    const blob = new Blob([encryptedFile.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'photo.capture'; a.click();
    URL.revokeObjectURL(url);
  };

  const retake = () => {
    setEncryptedFile(null);
    setShowResult(false);
    setStatus('');
    startCamera();
  };

  if (!isSupported || errorMsg) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Camera size={48} className="text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Camera Unavailable</h2>
        <p className="text-muted-foreground max-w-md">{errorMsg || "Your browser doesn't support the required camera APIs."}</p>
      </motion.div>
    );
  }

  const ratioClass = {
    '4:3': 'aspect-[3/4]',
    '16:9': 'aspect-[9/16]',
    '1:1': 'aspect-square'
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden">
      {/* Fullscreen view - bypass layout wrappers */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {!showResult ? (
        <>
          {/* Camera UI Top */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
              {(['1:1', '4:3', '16:9'] as const).map(r => (
                <button
                  key={r}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${aspectRatio === r ? 'bg-white text-black' : 'text-white/70'}`}
                  onClick={() => setAspectRatio(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              className={`p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 ${!hasTorch && 'opacity-50 cursor-not-allowed'}`}
              onClick={toggleTorch}
              disabled={!hasTorch}
            >
              {isTorchOn ? <Zap size={20} /> : <ZapOff size={20} className="opacity-50" />}
            </button>
          </div>

          {/* Camera Viewfinder */}
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Viewfinder Guide overlay based on aspect ratio */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className={`w-full ${ratioClass[aspectRatio]} max-h-full border border-white/20 relative`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30">
                  <Maximize2 size={48} strokeWidth={1} />
                </div>
              </div>
            </div>
          </div>

          {/* Camera UI Bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <div className="flex flex-col items-center gap-6 pb-8 px-6">
              <div className="h-6 text-white/80 text-sm font-medium flex items-center gap-2">
                {loading && <Loader className="animate-spin" size={16} />}
                {status || 'End-to-End Encrypted'}
              </div>

              {hasZoom && maxZoom > minZoom && (
                <div className="flex items-center gap-3 w-full max-w-xs bg-black/40 backdrop-blur-md p-2 px-4 rounded-full border border-white/10">
                  <span className="text-white text-xs font-bold w-6">{minZoom}x</span>
                  <input
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step="0.1"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 accent-white"
                  />
                  <span className="text-white text-xs font-bold w-6 text-right">{maxZoom}x</span>
                </div>
              )}

              <div className="flex justify-between items-center w-full max-w-sm">
                <div className="w-12"></div> {/* Spacer */}

                {/* Shutter Button */}
                <button
                  className="w-20 h-20 rounded-full border-[6px] border-white/40 flex items-center justify-center hover:border-white/60 active:scale-95 transition-all bg-transparent"
                  onClick={takePhoto}
                  disabled={loading || !stream}
                >
                  <div className="w-14 h-14 bg-white rounded-full"></div>
                </button>

                {/* Switch Camera */}
                <button
                  className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  onClick={() => {
                    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
                    setIsTorchOn(false);
                    setZoom(1);
                  }}
                >
                  <SwitchCamera size={22} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Success Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6 bg-black text-white"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Encrypted Successfully</h2>
          <p className="text-white/60 text-center max-w-xs mb-8">
            This photo is end-to-end encrypted and can only be viewed by the requester.
          </p>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl w-full max-w-sm mb-8 flex flex-col items-center gap-4">
            <Lock className="text-primary" size={32} />
            <div className="text-sm text-center">
              <span className="block font-bold mb-1 text-white/90">photo.capture</span>
              <span className="text-white/50 text-xs">{(encryptedFile!.length / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-3">
            <button className="bg-primary hover:bg-primary/90 text-white rounded-xl py-4 font-bold flex justify-center items-center gap-2 transition-colors" onClick={sharePhoto}>
              <Share size={20} /> Share via WhatsApp / Email
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white rounded-xl py-4 font-bold flex justify-center items-center gap-2 transition-colors" onClick={downloadPhoto}>
              <Download size={20} /> Save to Device
            </button>
            <button className="mt-4 text-white/50 text-sm font-medium hover:text-white transition-colors" onClick={retake}>
              Take another photo
            </button>
          </div>
        </motion.div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default function Capture() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader className="animate-spin text-primary" size={48} /></div>}>
      <CaptureContent />
    </Suspense>
  );
}