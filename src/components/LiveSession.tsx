import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, ShieldAlert, Activity } from 'lucide-react';
import { GeminiLiveSession } from '../lib/geminiLive';
import Waveform from './Waveform';

interface LiveSessionProps {
  audioConsent: boolean;
  videoConsent: boolean;
  onEndSession: () => void;
}

export default function LiveSession({ audioConsent, videoConsent, onEndSession }: LiveSessionProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(videoConsent);
  const [sessionState, setSessionState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

        sessionRef.current = new GeminiLiveSession(apiKey);
        
        await sessionRef.current.connect(
          (msg) => {
            // Check if agent is speaking based on audio output
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              setAgentSpeaking(true);
              // Simple timeout to reset speaking state
              setTimeout(() => setAgentSpeaking(false), 500);
            }
          },
          () => {
            // Interruption callback
            setAgentSpeaking(false);
          }
        );
        
        setSessionState('connected');
      } catch (err) {
        console.error("Failed to connect to Gemini Live", err);
        setSessionState('error');
      }
    };

    initSession();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Video Stream
  useEffect(() => {
    if (isCameraActive && videoConsent) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Failed to get camera stream", err);
          setIsCameraActive(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isCameraActive, videoConsent]);

  // Send Video Frames periodically
  useEffect(() => {
    if (!isCameraActive || sessionState !== 'connected') return;

    const intervalId = setInterval(() => {
      if (videoRef.current && canvasRef.current && sessionRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get base64 jpeg
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = dataUrl.split(',')[1];
          
          sessionRef.current.sendVideoFrame(base64Data);
        }
      }
    }, 1000); // Send 1 frame per second

    return () => clearInterval(intervalId);
  }, [isCameraActive, sessionState]);

  const handleEndCall = () => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
    }
    onEndSession();
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (sessionRef.current) {
      if (newMutedState) {
        sessionRef.current.mute();
      } else {
        sessionRef.current.unmute();
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold tracking-tight">HealthHalo</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <Activity className={`w-3 h-3 ${sessionState === 'connected' ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'}`} />
          {sessionState === 'connecting' ? 'Connecting...' : sessionState === 'connected' ? 'Live Session' : 'Error'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Video Feed (if active) */}
        {isCameraActive && (
          <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-60"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Agent Status UI */}
        <div className="z-10 flex flex-col items-center justify-center space-y-8 p-8 rounded-3xl bg-zinc-950/40 backdrop-blur-xl border border-zinc-800/50 shadow-2xl">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${agentSpeaking ? 'bg-emerald-500/30 opacity-100' : 'opacity-0'}`} />
            <div className="w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10 shadow-inner">
              <ShieldAlert className={`w-12 h-12 transition-colors duration-300 ${agentSpeaking ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-medium tracking-tight">
              {agentSpeaking ? 'Agent is speaking...' : 'Listening...'}
            </h2>
            <p className="text-sm text-zinc-400 max-w-xs">
              Speak naturally. You can interrupt at any time.
            </p>
          </div>

          <div className="h-16 flex items-center justify-center">
            <Waveform isActive={agentSpeaking || !isMuted} />
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="p-6 bg-gradient-to-t from-zinc-950 to-transparent z-10 flex items-center justify-center gap-6">
        <button 
          onClick={handleMuteToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button 
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20 transition-transform active:scale-95"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        <button 
          onClick={() => setIsCameraActive(!isCameraActive)}
          disabled={!videoConsent}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            !videoConsent ? 'opacity-50 cursor-not-allowed bg-zinc-900 text-zinc-600' :
            !isCameraActive ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
          }`}
        >
          {isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
        </button>
      </footer>
    </div>
  );
}
