"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion, scrambleTo } from "@/lib/scramble";

/** Decodes `text` from scrambled hex on mount. Decorative. */
export function ScrambleText({
  text,
  className,
  delay = 0,
  dur = 900,
}: {
  text: string;
  className?: string;
  delay?: number;
  dur?: number;
}) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    // Decode once per unique text. `dur`/`delay` are mount-time config kept out
    // of the deps on purpose, so re-renders (e.g. the registry list re-ordering
    // as the user types in the search box) never restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return scrambleTo(setShown, text, { dur, hold: delay, reduced: prefersReducedMotion() });
  }, [text]);

  return (
    <span className={className} aria-label={text}>
      {shown}
    </span>
  );
}
