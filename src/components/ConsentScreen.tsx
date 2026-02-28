import React, { useState, useEffect } from 'react';
import { ShieldAlert, Mic, Camera, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ConsentScreenProps {
  onConsent: (audio: boolean, video: boolean, initialAudio?: string | null) => void;
}

export default function ConsentScreen({ onConsent }: ConsentScreenProps) {
  const [audioConsent, setAudioConsent] = useState(true);
  const [videoConsent, setVideoConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greetingAudio, setGreetingAudio] = useState<string | null>(null);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const hour = new Date().getHours();
        let timeOfDay = "evening";
        if (hour < 12) timeOfDay = "morning";
        else if (hour < 18) timeOfDay = "afternoon";

        // @ts-ignore - Vite env var
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) return;
        
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: `Good ${timeOfDay}. I am HealthHalo. How can I help you today?`,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Zephyr" }
              }
            }
          }
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          setGreetingAudio(base64Audio);
        }
      } catch (err) {
        console.error("Failed to pre-fetch greeting", err);
      }
    };
    fetchGreeting();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Log consent to backend
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          audioConsent,
          videoConsent,
        }),
      });
      onConsent(audioConsent, videoConsent, greetingAudio);
    } catch (err) {
      console.error('Failed to log consent', err);
      // Proceed anyway for the prototype
      onConsent(audioConsent, videoConsent, greetingAudio);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">HealthHalo</h1>
          <p className="text-zinc-400 text-sm">
            Your real-time, multimodal healthcare Live Agent.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <h3 className="font-medium text-zinc-200 mb-2">Data Privacy & Safety</h3>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Sessions are ephemeral. Data is not stored.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> HealthHalo is NOT a doctor and cannot diagnose.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Call emergency services for life-threatening issues.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900 cursor-pointer hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-zinc-400" />
                <div>
                  <div className="font-medium">Microphone Access</div>
                  <div className="text-xs text-zinc-500">Required for voice interaction</div>
                </div>
              </div>
              <input type="checkbox" checked={audioConsent} disabled className="w-5 h-5 accent-emerald-500" />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900 cursor-pointer hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-zinc-400" />
                <div>
                  <div className="font-medium">Camera Access</div>
                  <div className="text-xs text-zinc-500">Optional for visual assessment</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={videoConsent} 
                onChange={(e) => setVideoConsent(e.target.checked)}
                className="w-5 h-5 accent-emerald-500" 
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Start Secure Session'}
        </button>
      </div>
    </div>
  );
}
