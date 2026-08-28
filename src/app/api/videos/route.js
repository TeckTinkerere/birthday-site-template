import { readdir } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const VIDEO_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

export async function GET() {
  const directory = path.join(process.cwd(), "public", "videos")

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const videos = entries
      .filter((entry) => entry.isFile())
      .map((entry) => ({ name: entry.name, extension: path.extname(entry.name).toLowerCase() }))
      .filter(({ extension }) => VIDEO_TYPES[extension])
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
      .map(({ name, extension }) => ({
        name,
        src: `/videos/${encodeURIComponent(name)}`,
        type: VIDEO_TYPES[extension],
      }))

    return Response.json({ videos })
  } catch (error) {
    if (error?.code === "ENOENT") return Response.json({ videos: [] })
    return Response.json({ error: "Unable to read videos" }, { status: 500 })
  }
}
