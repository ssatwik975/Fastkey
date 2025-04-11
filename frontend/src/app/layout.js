import './globals.css'

export const metadata = {
  title: 'FastKey - Biometric Authentication',
  description: 'Secure login with fingerprint authentication',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}</body>
    </html>
  )
}