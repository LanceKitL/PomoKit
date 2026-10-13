import { open, readdir } from "node:fs/promises"
import { join } from "node:path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const BREAK_GIF_DIRECTORY = join(process.cwd(), "public", "break")

export async function GET() {
  const entries = await readdir(BREAK_GIF_DIRECTORY, { withFileTypes: true })
  const gifFiles = entries
    .filter((entry) => entry.isFile() && /\.gif$/i.test(entry.name))
    .sort((first, second) =>
      first.name.localeCompare(second.name, undefined, { numeric: true }),
    )

  const gifs = await Promise.all(
    gifFiles.map(async ({ name }) => {
      const file = await open(join(BREAK_GIF_DIRECTORY, name), "r")

      try {
        const header = Buffer.alloc(10)
        const { bytesRead } = await file.read(header, 0, header.length, 0)
        const signature = header.toString("ascii", 0, 6)
        if (
          bytesRead < header.length ||
          (signature !== "GIF87a" && signature !== "GIF89a")
        ) {
          throw new Error(`Invalid GIF file in public/break: ${name}`)
        }

        const width = header.readUInt16LE(6)
        const height = header.readUInt16LE(8)
        if (width === 0 || height === 0) {
          throw new Error(`GIF has invalid dimensions in public/break: ${name}`)
        }

        return {
          src: `/break/${encodeURIComponent(name)}`,
          aspectRatio: width / height,
        }
      } finally {
        await file.close()
      }
    }),
  )

  return NextResponse.json(
    { gifs },
    { headers: { "Cache-Control": "no-store" } },
  )
}
