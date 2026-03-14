import "./globals.css"

export const metadata = {
  title: "What's the Supplier?",
  description: "AI-powered industrial supplier discovery",
  icons: {
    icon: "/favicon.ico",        // browser tab icon
    shortcut: "/favicon.ico",
    apple: "/favicon.ico"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>

        {/* NAVBAR */}
        <header className="bg-black text-white py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
            <div className="font-semibold">
              What's the Supplier?
            </div>

            <nav className="flex gap-6 text-sm">
              <a href="/">Home</a>
              <a href="/search">Search</a>
              <a href="/suppliers">Suppliers</a>
            </nav>
          </div>
        </header>

        {/* PAGE CONTENT */}
        {children}

      </body>
    </html>
  )
}