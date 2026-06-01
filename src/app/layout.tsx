import type { Metadata } from "next"
import { Sarabun } from "next/font/google"
import { AppShell } from "@/components/layout"
import { Providers } from "@/components/Providers"
import { PwaRegister } from "@/components/PwaRegister"
import "./globals.css"

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "MChat — บันทึกรายรับรายจ่ายด้วยแชท",
  description: "บันทึกรายรับรายจ่ายด้วยการพิมพ์ภาษาไทยธรรมดา",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MChat",
  },
  themeColor: "#2563EB",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body className="h-full font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </Providers>
      </body>
    </html>
  )
}
