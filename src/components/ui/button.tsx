import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg" | "icon"
}

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-on-accent hover:bg-primary-strong",
    secondary:
      "border border-line bg-surface-raised text-ink hover:bg-lavender hover:text-on-accent",
    ghost: "bg-transparent text-muted hover:bg-surface-raised hover:text-ink",
    danger: "bg-danger text-danger-ink hover:opacity-90",
  }
  const sizes = {
    sm: "min-h-11 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
    icon: "size-11 p-0",
  }

  return (
    <button
      type={type}
      className={cn(
        "interactive inline-flex items-center justify-center gap-2 rounded-xl font-bold disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
