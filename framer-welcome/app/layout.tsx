import type { Metadata } from 'next'
import './globals.css'
import Header from "@/components/Header.jsx";

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      
      <body style={{background : "#fffbea"}}>
        <Header />
        <div className='pt-20'>
        {children}
        </div>
        </body>
    </html>
  )
}
