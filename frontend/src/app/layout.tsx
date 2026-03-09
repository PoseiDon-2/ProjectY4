import type React from "react"
import type { Metadata } from "next"
import "../styles/globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster" 

export const metadata: Metadata = {
  title: "My Website",
  description: "Created with Web1165",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}