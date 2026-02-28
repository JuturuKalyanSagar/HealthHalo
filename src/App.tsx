import React, { useState } from 'react';
import ConsentScreen from './components/ConsentScreen';
import LiveSession from './components/LiveSession';

export default function App() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [audioConsent, setAudioConsent] = useState(false);
  const [videoConsent, setVideoConsent] = useState(false);
  const [initialAudio, setInitialAudio] = useState<string | null>(null);

  const handleConsent = (audio: boolean, video: boolean, greetingAudio?: string | null) => {
    setAudioConsent(audio);
    setVideoConsent(video);
    if (greetingAudio) {
      setInitialAudio(greetingAudio);
    }
    setSessionStarted(true);
  };

  const handleEndSession = async () => {
    setSessionStarted(false);
    setInitialAudio(null);
    // Optionally call backend to delete session data
    try {
      await fetch(`/api/session/current`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  return (
    <div className="font-sans antialiased text-zinc-100 bg-zinc-950 min-h-screen">
      {!sessionStarted ? (
        <ConsentScreen onConsent={handleConsent} />
      ) : (
        <LiveSession 
          audioConsent={audioConsent} 
          videoConsent={videoConsent} 
          initialAudio={initialAudio}
          onEndSession={handleEndSession} 
        />
      )}
    </div>
  );
}
