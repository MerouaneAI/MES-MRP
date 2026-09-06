// app/layout.tsx
import type { Metadata } from "next"
import { sans, serif } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "AurumMES — Enterprise Suite",
  description: "Manufacturing Execution System",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}