import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/toaster";
import { EnhancedAuthProvider } from "@/components/providers/EnhancedAuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ClientOnlyWrapper from "@/components/ClientOnlyWrapper";
import { DemoStripe } from "@/components/DemoStripe";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "USD Financial - Modern Financial Experience",
  description: "Next-generation digital financial services platform for the modern user. Manage finances, make payments, and invest with AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <DemoStripe />
        <ErrorBoundary>
          <ClientOnlyWrapper>
            <EnhancedAuthProvider>
              {children}
              <Toaster />
            </EnhancedAuthProvider>
          </ClientOnlyWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
