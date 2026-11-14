import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type LoopHandle = {
  stop: () => void;
  currentTime: () => number;
  setVolume: (volume: number) => void;
};

let audioContext: AudioContext | null = null;
let nativeModeReady = false;

export function sharedAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof AudioContext === 'undefined') return null;
  if (!audioContext) {
    audioContext = new AudioContext({ latencyHint: 'interactive' });
  }
  return audioContext;
}

export async function resumeAudio(): Promise<void> {
  const context = sharedAudioContext();
  if (context && context.state === 'suspended') {
    await context.resume();
  }
}

async function playOnWeb(bytes: Uint8Array, volume: number): Promise<LoopHandle> {
  const context = sharedAudioContext();
  if (!context) throw new Error('This browser cannot play audio.');
  if (context.state === 'suspended') await context.resume();
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const buffer = await context.decodeAudioData(copy);
  const gain = context.createGain();
  gain.gain.value = volume;
  gain.connect(context.destination);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  const startedAt = context.currentTime;
  source.start();
  return {
    stop() {
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
      gain.disconnect();
    },
    currentTime() {
      const elapsed = context.currentTime - startedAt;
      if (buffer.duration <= 0) return 0;
      return elapsed % buffer.duration;
    },
    setVolume(next) {
      gain.gain.value = next;
    },
  };
}

async function playOnNative(bytes: Uint8Array, volume: number): Promise<LoopHandle> {
  if (!nativeModeReady) {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    nativeModeReady = true;
  }
  const file = new File(Paths.cache, `horn-loop-${Date.now()}.wav`);
  if (!file.exists) file.create();
  await file.write(bytes);
  const player: AudioPlayer = createAudioPlayer({ uri: file.uri });
  player.loop = true;
  player.volume = volume;
  player.play();
  return {
    stop() {
      player.pause();
      player.remove();
      try {
        file.delete();
      } catch {
        // cache cleanup is best-effort
      }
    },
    currentTime() {
      const duration = player.duration;
      const time = player.currentTime;
      if (duration > 0) return time % duration;
      return time;
    },
    setVolume(next) {
      player.volume = next;
    },
  };
}

export async function playWavLoop(bytes: Uint8Array, volume: number): Promise<LoopHandle> {
  if (Platform.OS === 'web') return playOnWeb(bytes, volume);
  return playOnNative(bytes, volume);
}
