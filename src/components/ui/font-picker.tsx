"use client"

import React, { useEffect, useId, useRef, useState } from "react"
import { Check, Type } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/cn"
import { fontOption, fontOptions } from "@/features/preferences/font.model"
import type { FontName } from "@/features/preferences/font.model"
import { useFont } from "@/providers/font-provider"

export default function FontPicker({
  id,
  className,
  variant = "compact",
}: {
  id?: string
  className?: string
  variant?: "compact" | "full"
}) {
  const { font, setFont } = useFont()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listId = useId()
  const selected = fontOption(font)
  const selectedIndex = Math.max(
    0,
    fontOptions.findIndex((option) => option.value === font),
  )

  function openAt(index: number) {
    setActiveIndex(index)
    setOpen(true)
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function chooseFont(value: FontName) {
    setFont(value)
    close(true)
  }

  useEffect(() => {
    if (!open) return

    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close(false)
    }
    function closeOnScrollOrResize(event: Event) {
      if (
        event.type === "scroll" &&
        rootRef.current?.contains(event.target as Node)
      ) {
        return
      }
      close(false)
    }
    document.addEventListener("mousedown", closeOnOutside)
    window.addEventListener("scroll", closeOnScrollOrResize, true)
    window.addEventListener("resize", closeOnScrollOrResize)
    return () => {
      document.removeEventListener("mousedown", closeOnOutside)
      window.removeEventListener("scroll", closeOnScrollOrResize, true)
      window.removeEventListener("resize", closeOnScrollOrResize)
    }
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex])

  function move(delta: number) {
    setActiveIndex(
      (index) => (index + delta + fontOptions.length) % fontOptions.length,
    )
  }

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      openAt(selectedIndex)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      openAt(fontOptions.length - 1)
    }
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        move(1)
        break
      case "ArrowUp":
        event.preventDefault()
        move(-1)
        break
      case "Home":
        event.preventDefault()
        setActiveIndex(0)
        break
      case "End":
        event.preventDefault()
        setActiveIndex(fontOptions.length - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        chooseFont(fontOptions[activeIndex].value)
        break
      case "Escape":
        event.preventDefault()
        close(true)
        break
      case "Tab":
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Font: ${selected.label}`}
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "interactive text-ink",
          variant === "compact"
            ? "grid size-11 place-items-center rounded-xl hover:bg-surface"
            : "flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-surface-raised px-3 text-sm font-bold",
        )}
      >
        <Type aria-hidden="true" size={19} />
        {variant === "full" ? (
          <span className="flex-1 text-start">{selected.label}</span>
        ) : null}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label="Choose font"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onKeyDown={onListKeyDown}
            className={cn(
              "absolute top-[calc(100%+0.5rem)] z-50 min-w-64 rounded-2xl border border-line bg-surface p-2 paper-shadow",
              variant === "full" ? "start-0 w-full" : "end-0",
            )}
          >
            {fontOptions.map((option, index) => {
              const isSelected = option.value === font
              return (
                <li key={option.value} role="presentation">
                  <button
                    id={`${listId}-${option.value}`}
                    ref={(node) => {
                      optionRefs.current[index] = node
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => chooseFont(option.value)}
                    className={cn(
                      "interactive flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-start hover:bg-surface-raised",
                      index === activeIndex && "bg-surface-raised",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-muted">
                        {option.label}
                      </span>
                      <span
                        className="block truncate text-lg font-semibold text-ink"
                        style={{ fontFamily: option.preview }}
                      >
                        PomoKit
                      </span>
                    </span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        <Check
                          aria-hidden="true"
                          className="shrink-0 text-primary-strong"
                          size={17}
                        />
                      </motion.span>
                    )}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
