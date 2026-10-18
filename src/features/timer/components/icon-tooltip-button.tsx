"use client"

import { useId, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Button from "@/components/ui/button"

export default function IconTooltipButton({
  label,
  tooltip,
  onClick,
  variant = "secondary",
  disabled,
  pressed,
  align = "center",
  className,
  children,
}: {
  label: string
  tooltip?: string
  onClick: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  disabled?: boolean
  pressed?: boolean
  align?: "center" | "end"
  className?: string
  children: ReactNode
}) {
  const tooltipId = useId()
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const showTooltip = isHovered || isFocused

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        size="icon"
        variant={variant}
        onClick={onClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={label}
        aria-pressed={pressed}
        aria-describedby={showTooltip ? tooltipId : undefined}
        disabled={disabled}
        className={className}
      >
        {children}
      </Button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : -4,
              scale: prefersReducedMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : -3,
              scale: prefersReducedMotion ? 1 : 0.98,
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.16,
              ease: "easeOut",
            }}
            className={`pointer-events-none absolute top-full z-50 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold leading-5 text-ink shadow-lg ${
              align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
            }`}
          >
            {tooltip ?? label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
