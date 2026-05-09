import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { getSiteName } from "@/lib/supabase-server";

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: siteName,
    description: "專業代購服務，日本、韓國、美國、歐洲商品一站購齊",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "'Noto Sans TC', sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
