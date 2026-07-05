import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Cloakroom — check your tokens into confidentiality",
  description:
    "Wrap public ERC-20s into confidential ERC-7984 tokens, decrypt balances only you can see, and unwrap back — on Ethereum Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${schibsted.variable} ${mono.variable}`}>
      <body className="grain scanlines antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
