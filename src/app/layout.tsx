import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AmplifyProvider } from '@/components/providers/AmplifyProvider';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "North Playbook - Your Personal Life Guide",
  description: "Transform your life with North Playbook - a comprehensive personal development platform powered by AI insights",
  keywords: "personal development, life coaching, mindfulness, goals, motivation, AI insights",
  authors: [{ name: "North" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={inter.className}>
        <AmplifyProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
