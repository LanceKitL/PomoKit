import Link from "next/link"
import { TimerReset } from "lucide-react"

export default function Brand() {
  return (
    <Link
      href="/focus"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl text-xl font-extrabold tracking-tight text-ink"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-on-accent">
        <TimerReset aria-hidden="true" size={20} strokeWidth={2.5} />
      </span>
      <span className="font-display text-2xl">PomoKit</span>
    </Link>
  )
}
