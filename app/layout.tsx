import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_METADATA, GITHUB_REPO_URL } from "@/lib/site-config";
import { ExternalLinkIcon } from "./components/ui/Icons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_METADATA.title,
    template: "%s | Hack Day Starter",
  },
  description: SITE_METADATA.description,
  keywords: SITE_METADATA.keywords,
  authors: [{ name: "Hack Day Starter Contributors", url: GITHUB_REPO_URL }],
  creator: "Hack Day Starter",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    url: SITE_URL,
    siteName: SITE_METADATA.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hack Day Starter",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Windows, Linux",
  description: SITE_METADATA.description,
  url: SITE_URL,
  softwareRequirements: "Ollama, Node.js 18+",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        {/* Global Navigation Header */}
        <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-neutral-100 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>Hack Day Starter</span>
            </Link>

            <nav
              className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-neutral-400 overflow-x-auto"
              aria-label="Main Navigation"
            >
              <Link
                href="/"
                className="px-2.5 py-1.5 rounded-md hover:text-neutral-100 hover:bg-neutral-900 transition-colors shrink-0"
              >
                Profiler
              </Link>
              <Link
                href="/model-registry"
                className="px-2.5 py-1.5 rounded-md hover:text-neutral-100 hover:bg-neutral-900 transition-colors shrink-0"
              >
                Model Registry
              </Link>
              <Link
                href="/ollama-hardware-guide"
                className="px-2.5 py-1.5 rounded-md hover:text-neutral-100 hover:bg-neutral-900 transition-colors shrink-0 hidden sm:inline-block"
              >
                Hardware Guide
              </Link>
              <Link
                href="/ollama-tool-calling"
                className="px-2.5 py-1.5 rounded-md hover:text-neutral-100 hover:bg-neutral-900 transition-colors shrink-0 hidden md:inline-block"
              >
                Tool Calling
              </Link>
              <Link
                href="/how-it-works"
                className="px-2.5 py-1.5 rounded-md hover:text-neutral-100 hover:bg-neutral-900 transition-colors shrink-0 hidden sm:inline-block"
              >
                How It Works
              </Link>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                <span>GitHub</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Global Footer */}
        <footer className="border-t border-neutral-800/80 bg-neutral-950 py-10 text-xs text-neutral-400 mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="font-semibold text-neutral-200 mb-2">Hack Day Starter</div>
                <p className="text-neutral-400 leading-relaxed">
                  Deterministic local AI model recommendations and zero-dependency TypeScript starter scaffolding for Ollama.
                </p>
              </div>

              <div>
                <div className="font-semibold text-neutral-200 mb-2">Technical Guides</div>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/ollama-hardware-guide" className="hover:text-neutral-200 transition-colors">
                      Ollama Hardware Requirements
                    </Link>
                  </li>
                  <li>
                    <Link href="/ollama-tool-calling" className="hover:text-neutral-200 transition-colors">
                      Local Tool-Calling Agents
                    </Link>
                  </li>
                  <li>
                    <Link href="/how-it-works" className="hover:text-neutral-200 transition-colors">
                      Deterministic Sizing Logic
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-neutral-200 mb-2">Verified Data</div>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/model-registry" className="hover:text-neutral-200 transition-colors">
                      Ollama Verified Model Registry
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://ollama.com/library"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-200 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Official Ollama Library</span>
                      <ExternalLinkIcon className="w-2.5 h-2.5" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-neutral-200 mb-2">Open Source</div>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-200 transition-colors inline-flex items-center gap-1"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLinkIcon className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${GITHUB_REPO_URL}/blob/main/LICENSE`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-200 transition-colors"
                    >
                      MIT License
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-neutral-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-500 text-[11px]">
              <div>Built for Hacktoberfest 2026 — Weekend Challenge: Build for a Friend.</div>
              <div>Source verified against official Ollama library manifests.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
