// audioUtils.ts
// Handles audio capture and playback for Gemini Live API

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData: ((base64Data: string) => void) | null = null;
  
  // Playback
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;

  private isMuted: boolean = false;

  constructor() {}

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  async startRecording(onAudioData: (base64Data: string) => void) {
    this.onAudioData = onAudioData;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessorNode for simplicity in this prototype
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (this.isMuted) return; // Skip sending audio if muted
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64 = this.bufferToBase64(pcm16);
        if (this.onAudioData) {
          this.onAudioData(base64);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Error starting audio recording:", err);
      throw err;
    }
  }

  stopRecording() {
    if (this.processor && this.source) {
      this.source.disconnect();
      this.processor.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.processor = null;
    this.source = null;
    this.mediaStream = null;
    this.audioContext = null;
  }

  // Playback methods
  initPlayback() {
    if (!this.playbackContext) {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
    }
  }

  playAudioChunk(base64Data: string) {
    if (!this.playbackContext) return;
    
    const pcm16 = this.base64ToBuffer(base64Data);
    const float32 = this.pcm16ToFloat32(pcm16);
    
    const audioBuffer = this.playbackContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = this.playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackContext.destination);
    
    const currentTime = this.playbackContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    
    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
    }
  }

  // Helpers
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const view = new DataView(buffer);
    const float32 = new Float32Array(buffer.byteLength / 2);
    for (let i = 0; i < float32.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32[i] = int16 >= 0 ? int16 / 0x7FFF : int16 / 0x8000;
    }
    return float32;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
