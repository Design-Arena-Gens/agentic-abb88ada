import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D Particle Hand Gesture System',
  description: 'Interactive 3D particle system controlled by hand gestures',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
