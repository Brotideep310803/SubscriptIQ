import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "SubscriptIQ - Subscription Analytics SaaS Platform",
  description:
    "Enterprise-grade subscription analytics, customer management, plan provisioning, usage tracking, and simulated billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
