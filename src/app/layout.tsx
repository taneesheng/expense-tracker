import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "SpendWise - Expense Tracker",
  description: "Track your expenses, income, and financial goals",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendWise",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="px-4 lg:px-8 py-6 pb-24 lg:pb-8 min-h-[calc(100dvh-57px)]">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
