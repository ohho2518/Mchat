import type { Metadata } from "next"
import { Sarabun } from "next/font/google"
import { AppShell } from "@/components/layout"
import { Providers } from "@/components/Providers"
import "./globals.css"

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "MChat — บันทึกรายรับรายจ่ายด้วยแชท",
  description: "บันทึกรายรับรายจ่ายด้วยการพิมพ์ภาษาไทยธรรมดา",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
