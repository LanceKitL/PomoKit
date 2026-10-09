"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"

export default function TimerDigitTransition({
  display,
}: {
  display: string
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <span
      aria-hidden="true"
      className="inline-flex align-middle"
    >
      {Array.from(display, (character, index) =>
        character === ":" ? (
          <span key={`separator-${index}`}>{character}</span>
        ) : (
          <span
            key={`digit-slot-${index}`}
            className="inline-grid overflow-hidden align-middle"
            style={{ gridTemplateAreas: '"digit"' }}
          >
            <AnimatePresence initial={false}>
              <motion.span
                key={character}
                initial={
                  prefersReducedMotion
                    ? { y: 0, filter: "blur(0px)" }
                      : { y: "-0.45em", filter: "blur(5px)" }
                }
                animate={{ y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.18,
                  ease: "easeOut",
                }}
                className="inline-block"
                style={{ gridArea: "digit" }}
              >
                {character}
              </motion.span>
            </AnimatePresence>
          </span>
        ),
      )}
    </span>
  )
}
