import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "OSS Contributor - AI-Powered Open Source Contributions",
  description:
    "Automatically find, analyze, and contribute to open source projects with AI assistance.",
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        <ThemeProvider>
          <ToastProvider>
            <Providers>{children}</Providers>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}