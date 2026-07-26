import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'kitchen.sound';

// Browsers refuse to play audio until the page has been interacted with, and a
// wall-mounted kitchen tablet may sit untouched for hours after loading. So we
// build the AudioContext lazily on the first gesture and keep it alive, rather
// than creating one per beep (Chrome caps the number of contexts per tab).
function useAudioContext() {
  const ref = useRef<AudioContext | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unlock = () => {
      if (!ref.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctor) return;
        ref.current = new Ctor();
      }
      ref.current.resume().then(() => setReady(true)).catch(() => { /* still locked */ });
    };
    // `once` is wrong here: the very first gesture can land while the tab is
    // still backgrounded, in which case resume() stays suspended.
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, unlock));
    unlock();
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  return { ctxRef: ref, ready };
}

/**
 * Audible new-order alert for the kitchen board.
 *
 * A single beep at the moment the order arrives is not enough - the one person
 * who could hear it is often at the pass with their hands full. So the chime
 * repeats while anything is still waiting to be accepted, and stops by itself
 * the moment the last pending order is picked up.
 */
export function useKitchenAlarm(pendingCount: number) {
  const { ctxRef, ready } = useAudioContext();

  // Persisted so a muted screen stays muted across the reloads that a kiosk
  // browser does on its own.
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(window.localStorage.getItem(STORAGE_KEY) !== 'off');
  }, []);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      // Confirm the un-mute audibly - otherwise there is no way to tell a
      // working speaker from a silent one until an order is lost.
      if (next) chime(ctxRef.current, 1);
      return next;
    });
  }, [ctxRef]);

  const play = useCallback(() => {
    if (!enabled) return;
    chime(ctxRef.current, 3);
  }, [enabled, ctxRef]);

  // Nag while orders sit unaccepted.
  useEffect(() => {
    if (!enabled || pendingCount === 0) return;
    const id = window.setInterval(() => chime(ctxRef.current, 2), 25000);
    return () => window.clearInterval(id);
  }, [enabled, pendingCount, ctxRef]);

  return { play, enabled, toggle, audioReady: ready };
}

// Two-tone doorbell, synthesised rather than shipped as an mp3: no asset to
// load, and it cuts through kitchen noise better than a soft notification ping.
function chime(ctx: AudioContext | null, times: number) {
  if (!ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime;
  for (let i = 0; i < times; i++) {
    const at = start + i * 0.42;
    tone(ctx, 988, at, 0.18);        // B5
    tone(ctx, 1319, at + 0.16, 0.24); // E6
  }
}

function tone(ctx: AudioContext, freq: number, at: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  // Ramped rather than switched: an abrupt gain change clicks audibly.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}
