const GLYPHS = "0123456789ABCDEF#%&$?/<>*+=".split("");
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const keep = (c: string) => c === "," || c === "." || c === " ";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Animate `set` from scrambled hex toward `finalText`, resolving left to right.
 * Punctuation and spaces are held in place so numbers stay legible.
 *
 * Fail-safe: the caller's initial state should already be `finalText`. The first
 * animation frame overwrites it with ciphertext; if requestAnimationFrame never
 * fires (backgrounded tab) the value simply stays final. A timeout guarantees the
 * final value is set within a bounded time even if frames stall mid-animation.
 * Returns a cancel function.
 */
export function scrambleTo(
  set: (s: string) => void,
  finalText: string,
  opts: { dur?: number; hold?: number; reduced?: boolean } = {},
): () => void {
  const { dur = 720, hold = 0, reduced = false } = opts;
  if (reduced || finalText.length === 0) {
    set(finalText);
    return () => {};
  }
  let raf = 0;
  let done = false;
  const start = performance.now();
  // persistent buffer: unrevealed glyphs hold across frames and only change
  // now and then, so the decode reads as a calm settle rather than a strobe.
  const buf = finalText.split("").map((c) => (keep(c) ? c : rnd()));
  const finish = () => {
    if (done) return;
    done = true;
    set(finalText);
  };
  const tick = (now: number) => {
    const t = Math.min(1, (now - start - hold) / dur);
    if (t < 0) {
      set(buf.join(""));
      raf = requestAnimationFrame(tick);
      return;
    }
    const reveal = Math.floor(t * finalText.length);
    for (let i = 0; i < finalText.length; i += 1) {
      const c = finalText[i];
      if (i < reveal || keep(c)) buf[i] = c;
      else if (Math.random() < 0.5) buf[i] = rnd();
    }
    set(buf.join(""));
    if (t < 1) raf = requestAnimationFrame(tick);
    else finish();
  };
  raf = requestAnimationFrame(tick);
  const guard = setTimeout(finish, hold + dur + 500);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(guard);
  };
}
