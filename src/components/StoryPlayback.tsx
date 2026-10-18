import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { useGameAudio } from './GameAudio';

export function StoryPlayback({ text }: { text: string }) {
  const { narrating } = useGameAudio();
  const narratingRef = useRef(narrating); narratingRef.current = narrating;
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [error, setError] = useState<string | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => () => { window.speechSynthesis?.cancel(); narratingRef.current(false); }, [text]);
  useEffect(() => { narratingRef.current(status === 'playing'); }, [status]);
  function play() {
    if (!('speechSynthesis' in window)) { setError('Voice playback is unavailable on this device. The full story is below.'); return; }
    if (status === 'paused') { window.speechSynthesis.resume(); setStatus('playing'); return; }
    window.speechSynthesis.cancel(); setError(null);
    const speech = new SpeechSynthesisUtterance(text); speech.lang = 'en-IN'; speech.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.localService && v.lang.toLowerCase() === 'en-in')
      ?? voices.find(v => v.localService && v.lang.toLowerCase().startsWith('en'));
    if (voice) speech.voice = voice;
    speech.onend = () => setStatus('idle');
    speech.onerror = () => { setStatus('idle'); setError('Voice playback stopped. You can read the full story below.'); };
    utterance.current = speech; window.speechSynthesis.speak(speech); setStatus('playing');
  }
  return <div className="mt-4">
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={status === 'playing' ? () => { window.speechSynthesis.pause(); setStatus('paused'); } : play}>
        {status === 'playing' ? <Pause /> : <Play />}{status === 'playing' ? 'Pause story' : status === 'paused' ? 'Resume story' : 'Listen to story'}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Stop story" title="Stop story" disabled={status === 'idle'} onClick={() => { window.speechSynthesis.cancel(); setStatus('idle'); }}><Square /></Button>
    </div>
    {error && <p role="status" className="mt-2 text-xs text-muted-foreground">{error}</p>}
    <p className="mt-3 text-sm leading-relaxed">{text}</p>
  </div>;
}