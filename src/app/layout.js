import { Fraunces, Source_Serif_4 } from "next/font/google"
import "./globals.css"
import { BIRTHDAY, SITE_URL } from "@/lib/content"

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-display",
})

const body = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-body",
})

// Recomputed on every request (not just at build time) so the preview copy
// below flips itself the moment the date passes - no rebuild needed.
export const dynamic = "force-dynamic"

export function generateMetadata() {
  const previewDescription =
    Date.now() < BIRTHDAY.getTime()
      ? "A quiet letter, waiting for the right day to open."
      : "A quiet letter - open whenever you're free."

  return {
    metadataBase: new URL(SITE_URL),
    title: "A Letter",
    description: previewDescription,
    // A private letter. It should never turn up in a search result.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "A Letter",
      title: "A Letter",
      description: previewDescription,
      locale: "en_SG",
    },
    twitter: {
      card: "summary_large_image",
      title: "A Letter",
      description: previewDescription,
    },
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e6eaef",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}
