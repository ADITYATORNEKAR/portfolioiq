"use client";

import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { BarChart2, Github } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
  }));

  return (
    <html lang="en" className="dark">
      <head>
        <title>HFT Causal Platform</title>
        <meta
          name="description"
          content="Discover causal relationships in your stock portfolio using rigorous causal inference and AI agents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen bg-surface text-slate-100 antialiased">
        <QueryClientProvider client={queryClient}>
          {/* Nav */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold text-white hover:text-brand-500 transition-colors"
                >
                  <BarChart2 className="h-5 w-5 text-brand-500" />
                  <span className="hidden sm:inline">HFT Causal Platform</span>
                  <span className="sm:hidden">HFT Causal</span>
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    href="/analyze"
                    className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
                  >
                    Analyze Portfolio
                  </Link>
                  <a
                    href="https://github.com/ADITYATORNEKAR/hft-causal-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Page content */}
          <main className="pt-14">{children}</main>

          {/* Footer */}
          <footer className="mt-24 border-t border-surface-border py-8">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
              <p>
                HFT Causal Platform — 100% free stack. Built by{" "}
                <a
                  href="https://github.com/ADITYATORNEKAR"
                  className="text-brand-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Aditya Tornekar
                </a>
                .
              </p>
              <p className="mt-1 text-xs">
                Data: yfinance · Causal: PC Algorithm + Double ML · AI: Groq
                Llama-3.3-70B · Deploy: Fly.io + Vercel
              </p>
            </div>
          </footer>
        </QueryClientProvider>
      </body>
    </html>
  );
}
