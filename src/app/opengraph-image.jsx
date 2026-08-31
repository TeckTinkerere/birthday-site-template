import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "A private letter"

// Deliberately generic: no recipient name, no date. Whoever it's shared to
// shouldn't learn anything from the preview card alone.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(160deg, #fdf1f2 0%, #f3dfe5 48%, #e6c8d3 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 64,
            height: 1,
            background: "#c0405f",
          }}
        />
        <div style={{ display: "flex", fontSize: 58, color: "#3a2630", letterSpacing: -1 }}>
          A private letter
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#7a5566", letterSpacing: 1 }}>
          open when you&apos;re ready
        </div>
        <div
          style={{
            display: "flex",
            width: 64,
            height: 1,
            background: "#c0405f",
          }}
        />
      </div>
    ),
    size,
  )
}
