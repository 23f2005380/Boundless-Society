import type { Metadata } from 'next'
import './globals.css'
import Header from "@/components/Header.jsx";

export const metadata: Metadata = {
  title: 'Boundless Travel Society',
  description: 'IITM based society to make traveling jhakas',
  generator: '',
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
