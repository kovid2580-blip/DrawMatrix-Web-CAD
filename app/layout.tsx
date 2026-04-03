import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { CallProvider } from "@/providers/CallContext";
import { FloatingVideoCall } from "@/components/video-call/FloatingVideoCall";
import { NextAuthProvider } from "@/providers/NextAuthProvider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DRAWMATRIX",
  description: "Online realtime drawing tool",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <CallProvider>
              {children}
              <FloatingVideoCall />
            </CallProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
