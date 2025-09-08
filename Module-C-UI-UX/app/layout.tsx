import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
// Performance utilities are now handled inline in the script tag
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InternAI - Find Your Perfect Internship",
  description: "AI-powered internship matching platform with voice support and personalized recommendations. Connect with opportunities that match your skills and aspirations.",
  keywords: "internship, AI, career, jobs, voice search, personalized matching",
  authors: [{ name: "InternAI Team" }],
  creator: "InternAI",
  publisher: "InternAI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://internai.app",
    title: "InternAI - Find Your Perfect Internship",
    description: "AI-powered internship matching platform with voice support",
    siteName: "InternAI",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InternAI - AI-powered internship matching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InternAI - Find Your Perfect Internship",
    description: "AI-powered internship matching platform with voice support",
    images: ["/images/twitter-image.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/images/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className="font-body antialiased">
        {/* Performance monitoring (client-only via components; avoid bare imports here) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }

              // Preload critical resources
              window.addEventListener('load', function() {
                setTimeout(() => {
                  // Preload fonts
                  const fontLink = document.createElement('link');
                  fontLink.rel = 'preload';
                  fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap';
                  fontLink.as = 'style';
                  document.head.appendChild(fontLink);
                }, 100);
              });

              // Error tracking
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
              });

              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
              });
            `,
          }}
        />

        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
