import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tymai.dev — Tyler Munstock",
  description:
    "10 years building AI-driven game systems. Now building AI applications, agents, and developer tools. Portfolio of Tyler Munstock.",
  keywords: [
    "Tyler Munstock",
    "AI developer",
    "developer advocate",
    "multi-agent systems",
    "Unreal Engine",
    "Claude API",
    "TypeScript",
    "Node.js",
  ],
  authors: [{ name: "Tyler Munstock" }],
  metadataBase: new URL("https://tymai.dev"),
  openGraph: {
    title: "tymai.dev — Tyler Munstock",
    description:
      "10 years building AI-driven game systems. Now building AI applications, agents, and developer tools.",
    type: "website",
    url: "https://tymai.dev",
  },
  alternates: {
    canonical: "https://tymai.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
