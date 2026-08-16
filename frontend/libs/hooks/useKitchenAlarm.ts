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

// A struck counter bell, synthesised rather than shipped as an mp3: no asset
// to load, and it carries over an extractor fan far better than a soft
// notification ping. Each strike is one hit of the bell, and the ring is left
// to fade on its own.
const BELL_HZ = 1046; // C6 - the bright end of a service bell

function chime(ctx: AudioContext | null, times: number) {
  if (!ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime;
  const bus = master(ctx);
  for (let i = 0; i < times; i++) {
    strike(ctx, bus, start + i * 0.5);
  }
}

// Compressor on the master, not just a bigger gain: partials stacking on top of
// each other would clip and buzz, and clipping sounds thin rather than loud.
// Squashing the peaks lets the whole ring sit near full scale.
function master(ctx: AudioContext) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 6;
  comp.ratio.value = 12;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  comp.connect(out).connect(ctx.destination);
  return comp;
}

function strike(ctx: AudioContext, bus: AudioNode, at: number) {
  // What makes it read as metal rather than a beep: partials at inharmonic
  // ratios, the high ones loud at the moment of the hit but dying first, so
  // the strike is bright and the tail settles onto the fundamental.
  const partials: [ratio: number, level: number, decay: number][] = [
    [1, 1, 1.9],
    [2.0, 0.6, 1.3],
    [2.98, 0.5, 0.9],
    [4.12, 0.32, 0.6],
    [5.43, 0.22, 0.4],
    [6.79, 0.14, 0.25],
  ];
  for (const [ratio, level, decay] of partials) {
    tone(ctx, bus, BELL_HZ * ratio, at, level * 0.45, decay);
  }
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  at: number,
  peak: number,
  decay: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  // Near-instant attack, long exponential decay: that envelope is the whole
  // difference between "struck" and "switched on". Still ramped, not stepped,
  // because an abrupt gain change clicks audibly.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(dest);
  osc.start(at);
  osc.stop(at + decay + 0.05);
}
