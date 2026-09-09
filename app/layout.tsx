import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ledgerly — Asset tracking",
  description: "A considered view of everything you own.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={manrope.variable}><ToastProvider>{children}</ToastProvider></body></html>;
}
