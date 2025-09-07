import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrackLink - Location Tracking Link Generator",
  description: "Create tracking links that capture visitor location data with detailed analytics and real-time monitoring.",
  keywords: ["tracking links", "location tracking", "analytics", "link generator", "visitor tracking"],
  authors: [{ name: "TrackLink" }],
  openGraph: {
    title: "TrackLink - Location Tracking Link Generator",
    description: "Create tracking links that capture visitor location data with detailed analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">TL</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground">TrackLink</h1>
                      <p className="text-xs text-muted-foreground">Location Tracking Links</p>
                    </div>
                  </div>
                  
                  <nav className="hidden md:flex items-center space-x-6">
                    <a 
                      href="/" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </a>
                    <a 
                      href="/analytics" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Analytics
                    </a>
                  </nav>

                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Live Tracking</span>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1">
              {children}
            </main>

            <footer className="border-t mt-16">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">TrackLink</h3>
                    <p className="text-sm text-muted-foreground">
                      Professional location tracking and analytics for your links.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Real-time location tracking</li>
                      <li>Detailed visitor analytics</li>
                      <li>QR code generation</li>
                      <li>Custom link aliases</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Privacy</h4>
                    <p className="text-sm text-muted-foreground">
                      All location data is collected with user consent and stored securely.
                    </p>
                  </div>
                </div>
                
                <div className="border-t mt-8 pt-8">
                  <p className="text-center text-sm text-muted-foreground">
                    © 2024 TrackLink. Built with Next.js and love for privacy.
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}