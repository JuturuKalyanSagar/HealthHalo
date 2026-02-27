// geminiLive.ts
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioStreamer } from "./audioUtils";

export class GeminiLiveSession {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioStreamer: AudioStreamer;
  private onMessageCallback: ((msg: any) => void) | null = null;
  private onInterruptionCallback: (() => void) | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.audioStreamer = new AudioStreamer();
  }

  async connect(onMessage: (msg: any) => void, onInterruption: () => void) {
    this.onMessageCallback = onMessage;
    this.onInterruptionCallback = onInterruption;

    this.audioStreamer.initPlayback();

    const systemInstruction = `You are HealthHalo, a real-time, multimodal healthcare Live Agent.
You are a calm, authoritative presence that sees, hears, and guides users in moments of medical uncertainty.

CRITICAL RULES:
1. You are NOT a doctor. You do NOT diagnose.
2. You help users reason, observe, and act safely.
3. You escalate to emergency services when needed.
4. Explain uncertainty transparently.
5. Keep responses EXTREMELY brief (1-2 sentences max) to minimize latency.
6. Focus on safety, clarity, and the next best action.
7. If the user provides a camera feed, use it to assess the situation.
8. Multilingual Support: You are naturally multilingual. If a user or bystander speaks a different language (e.g., Spanish, French, etc.), automatically switch to that language to guide them. Act as a real-time medical translator if needed to facilitate communication between different parties.

Tone: Professional, empathetic, calm, and decisive.`;

    this.sessionPromise = this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      callbacks: {
        onopen: () => {
          console.log("Connected to Gemini Live API");

          if (this.sessionPromise) {
            this.sessionPromise.then((session) => {
              const hour = new Date().getHours();
              let timeOfDay = "evening";
              if (hour < 12) timeOfDay = "morning";
              else if (hour < 18) timeOfDay = "afternoon";

              session.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [{ text: `Hi, I just connected. Please greet me with "Good ${timeOfDay}" and introduce yourself briefly in one sentence.` }]
                  }
                ],
                turnComplete: true
              });
            });
          }

          // Start capturing audio
          this.audioStreamer.startRecording((base64Data) => {
            if (this.sessionPromise) {
              this.sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
                });
              });
            }
          });
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle audio output
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            this.audioStreamer.playAudioChunk(base64Audio);
          }
          
          // Handle interruption
          if (message.serverContent?.interrupted) {
            console.log("Interrupted by user");
            this.audioStreamer.stopPlayback();
            this.audioStreamer.initPlayback(); // Re-init for next turn
            if (this.onInterruptionCallback) {
              this.onInterruptionCallback();
            }
          }

          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        },
        onerror: (err) => {
          console.error("Gemini Live API Error:", err);
        },
        onclose: () => {
          console.log("Gemini Live API Connection Closed");
          this.audioStreamer.stopRecording();
          this.audioStreamer.stopPlayback();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction,
      },
    });

    await this.sessionPromise;
  }

  sendVideoFrame(base64Data: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: "image/jpeg" },
        });
      });
    }
  }

  mute() {
    this.audioStreamer.mute();
  }

  unmute() {
    this.audioStreamer.unmute();
  }

  disconnect() {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        // Close the session
        // Note: The SDK might not have a direct close method on the session object yet,
        // but we can stop the audio streamer.
        this.audioStreamer.stopRecording();
        this.audioStreamer.stopPlayback();
        this.sessionPromise = null;
      });
    }
  }
}
