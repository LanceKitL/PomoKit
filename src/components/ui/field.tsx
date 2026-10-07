import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react"
import { cn } from "@/lib/cn"

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode
  htmlFor: string
}) {
  return (
    <label className="mb-2 block text-sm font-bold text-ink" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-line bg-surface-raised px-4 text-base text-ink placeholder:text-muted/70",
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-xl border border-line bg-surface-raised px-4 text-base text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
