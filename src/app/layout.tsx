import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ui/Toast';

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Copa dos Amigos",
  description: "Bolão da Copa do Mundo 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Copa dos Amigos",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#15803d" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geist.className} min-h-full bg-gray-50`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
