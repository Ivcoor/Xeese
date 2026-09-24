import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "XeeseArchieve", template: "%s · XeeseArchieve" },
  description: "Alquiler de prendas de lujo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-border text-muted border-t px-4 py-6 text-center text-sm">
          © {new Date().getFullYear()} XeeseArchieve
        </footer>
      </body>
    </html>
  );
}
