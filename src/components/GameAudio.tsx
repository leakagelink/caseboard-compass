import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';

const AudioSettings = createContext({ playing: false, toggle: () => {}, narrating: (_active: boolean) => {}, error: '' });
export const useGameAudio = () => useContext(AudioSettings);

export function GameAudioProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const context = useRef<AudioContext | null>(null);
  const volume = useRef<GainNode | null>(null);
  const voiceActive = useRef(false);
  function updateVolume() {
    const ctx = context.current;
    if (ctx && volume.current) volume.current.gain.setTargetAtTime(voiceActive.current ? 0.008 : 0.035, ctx.currentTime, 0.3);
  }
  async function toggle() {
    try {
      if (playing) { await context.current?.suspend(); setPlaying(false); return; }
      if (!context.current) {
        const ctx = new AudioContext(); context.current = ctx;
        const master = ctx.createGain(); volume.current = master;
        master.gain.value = 0.035; master.connect(ctx.destination);
        // Original slow-moving minor drone: generated locally, no downloads or API calls.
        [55, 82.41, 110, 130.81].forEach((frequency, index) => {
          const tone = ctx.createOscillator(); tone.type = 'sine'; tone.frequency.value = frequency;
          const gain = ctx.createGain(); gain.gain.value = 0.22;
          const pulse = ctx.createOscillator(); pulse.frequency.value = 0.07 + index * 0.02;
          const depth = ctx.createGain(); depth.gain.value = 0.12;
          pulse.connect(depth); depth.connect(gain.gain);
          tone.connect(gain); gain.connect(master); tone.start(); pulse.start();
        });
      }
      await context.current.resume(); updateVolume(); setPlaying(true); setError('');
    } catch { setError('Music is unavailable on this device.'); setPlaying(false); }
  }
  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) { void context.current?.suspend(); setPlaying(false); }
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => { document.removeEventListener('visibilitychange', stopWhenHidden); void context.current?.close(); };
  }, []);
  return <AudioSettings.Provider value={{ playing, toggle: () => void toggle(), narrating: (active) => { voiceActive.current = active; updateVolume(); }, error }}>{children}</AudioSettings.Provider>;
}

export function MusicControl() {
  const { playing, toggle, error } = useGameAudio();
  return <div className="flex items-center gap-2">
    {error && <span role="status" className="text-xs text-muted-foreground">{error}</span>}
    <Button size="icon" variant="ghost" aria-label={playing ? 'Mute background music' : 'Play background music'} title={playing ? 'Mute background music' : 'Play background music'} aria-pressed={playing} onClick={toggle}>{playing ? <Music2 className="text-ghost" /> : <VolumeX />}</Button>
  </div>;
}