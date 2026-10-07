import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

export default function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section
      className={cn("rounded-3xl bg-surface paper-shadow", className)}
      {...props}
    >
      {children}
    </section>
  )
}
