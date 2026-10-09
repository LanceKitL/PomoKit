import Image from "next/image"

import Link from "next/link"

export default function Brand() {
  return (
    <Link
      href="/focus"
      aria-label="PomoKit home"
      className="inline-flex min-h-12 items-center gap-2 rounded-xl text-xl font-extrabold tracking-tight text-ink"
    >
      <Image
        src="/logo.png"
        alt=""
        width={48}
        height={48}
        priority
        className="size-12 shrink-0 rounded-xl object-contain"
      />
      <span className="hidden font-display text-2xl min-[420px]:inline">
        PomoKit
      </span>
    </Link>
  )
}
