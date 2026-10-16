"use client";

import { useEffect, useState } from "react";

// "Hello" in the languages I speak, each typed out like a typewriter, then cut to the next.
const WORDS = [
  { text: "hello", lang: "en" },
  { text: "नमस्ते", lang: "hi" },
  { text: "നമസ്കാരം", lang: "ml" },
  { text: "नमस्कार", lang: "mr" },
  { text: "bonjour", lang: "fr" },
];
const TYPE_MS = 70; // per character
const FIRST_READ_MS = 450; // the opening word lingers a little once typed
const READ_MS = 300; // how long each later word sits once typed
const HOLD_MS = 650; // pause on the last word before the curtain lifts

// Split by grapheme cluster so Devanagari/Malayalam letters keep their vowel signs as they type.
const clusters = (text: string) => typeof Intl !== "undefined" && "Segmenter" in Intl
  ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
  : Array.from(text);
const PARTS = WORDS.map((word) => clusters(word.text));
const BARS = 5;
// Each bar leaves a beat after the one to its left, evenly spaced so the exit flows.
const BAR_DELAYS = Array.from({ length: BARS }, (_, i) => i * 90);
const BAR_MS = 1100; // matches the bar-exit animation in globals.css
const LIFT_MS = Math.max(...BAR_DELAYS) + BAR_MS;

/** Full-screen purple intro. Calls onReveal as the curtain starts lifting and onDone once it's gone. */
export function Loader({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [lifting, setLifting] = useState(false);

  // Type the current word one cluster at a time, let it sit, then cut to the next word (or lift).
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parts = PARTS[index];
    setTyped(reduced ? parts.length : 0);
    const typing = reduced ? 0 : window.setInterval(() => setTyped((n) => Math.min(parts.length, n + 1)), TYPE_MS);
    const typeTime = reduced ? 0 : parts.length * TYPE_MS;
    const last = index === WORDS.length - 1;
    const wait = typeTime + (last ? HOLD_MS : index === 0 ? FIRST_READ_MS : READ_MS);
    const timer = window.setTimeout(() => {
      if (last) { setLifting(true); onReveal(); }
      else { setTyped(0); setIndex((i) => i + 1); } // reset together so the next word never flashes fully typed
    }, reduced ? 250 : wait);
    return () => { window.clearInterval(typing); window.clearTimeout(timer); };
  }, [index, onReveal]);

  useEffect(() => {
    if (!lifting) return;
    const timer = window.setTimeout(onDone, LIFT_MS);
    return () => window.clearTimeout(timer);
  }, [lifting, onDone]);

  const word = WORDS[index];
  return <div className={`loader ${lifting ? "is-lifting" : ""}`} role="status" aria-label="Loading" style={{ "--bars": BARS } as React.CSSProperties}>
    {/* The purple sheet is a row of soundbars; on exit they retract upward in a wave. */}
    <div className="loader-bars paper-bars" aria-hidden="true">
      {BAR_DELAYS.map((delay, i) => <span key={i} style={{ "--i": i, animationDelay: `${delay}ms` } as React.CSSProperties} />)}
    </div>
    <p className="loader-word" key={word.lang} lang={word.lang} aria-label={word.text}>
      {/* Typed part, the caret, then the untyped rest held invisibly so the word types in place. */}
      <span>{PARTS[index].slice(0, typed).join("")}</span>
      <span className="caret" aria-hidden="true" />
      <span className="untyped" aria-hidden="true">{PARTS[index].slice(typed).join("")}</span>
    </p>
  </div>;
}

/* ─── Page wipe: the same paper bars, quicker, for switching pages ─── */

const WIPE_BAR_MS = 320; // matches the wipe animations in globals.css
const WIPE_STAGGER_MS = 40;
/** How long the bars take to fully cover (or fully clear) the screen. */
export const WIPE_MS = WIPE_BAR_MS + (BARS - 1) * WIPE_STAGGER_MS;

/** "cover" sweeps the bars over the page, "reveal" carries them on off the far edge, "idle" hides them.
 *  direction "up" rises from the bottom (dock); "down" drops from the top (top bar). */
export function PageWipe({ phase, direction }: { phase: "idle" | "cover" | "reveal"; direction: "up" | "down" }) {
  return <div className={`wipe paper-bars is-${phase} go-${direction}`} aria-hidden="true" style={{ "--bars": BARS } as React.CSSProperties}>
    {Array.from({ length: BARS }, (_, i) => <span key={i} style={{ "--i": i, animationDelay: `${i * WIPE_STAGGER_MS}ms` } as React.CSSProperties} />)}
  </div>;
}
