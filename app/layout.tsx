import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Git Archaeologist — Why was this code written?",
  description:
    "Mine your git history. Get cited AI narratives explaining why code exists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
