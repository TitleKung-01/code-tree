import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { ParticlesBackground } from "@/components/ui/particles";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Code Tree — ระบบจัดสายรหัส",
  description: "จัดเรียงพี่น้องสายรหัส แบบ Drag & Drop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <div className="relative min-h-screen">
          <ParticlesBackground />
          <div className="relative z-10">
            <Navbar />
            <main>{children}</main>
          </div>
          <Toaster position="bottom-right" richColors />
        </div>
      </body>
    </html>
  );
}