import { Fraunces, Source_Serif_4 } from "next/font/google"
import "./globals.css"
import { RECIPIENT } from "@/lib/content"

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

export const metadata = {
  title: `For ${RECIPIENT}`,
  description: "A quiet letter - a memory, a thank you, and good wishes for the years ahead",
  // A private letter. It should never turn up in a search result.
  robots: { index: false, follow: false },
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
