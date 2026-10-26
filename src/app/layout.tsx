import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) } : {}),
  title: { default: "Praveen Dhakade — Software Engineer", template: "%s | Praveen Dhakade" },
  description: "Portfolio of Praveen Kumar Dhakade, a full-stack software engineer working across backend, web, and mobile products.",
  openGraph: { title: "Praveen Dhakade — Software Engineer", description: "Backend-focused full-stack engineering across web, mobile, and data workflows.", type: "website" },
};

const nav = [["About", "/about"], ["Experience", "/experience"], ["Projects", "/projects"], ["Journal", "/journal"], ["Assistant", "/assistant"], ["Contact", "/contact"]];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link className="brand" href="/">Praveen Dhakade<span>.</span></Link><nav aria-label="Main navigation">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></header><main id="main">{children}</main><footer className="site-footer"><span>© {new Date().getFullYear()} Praveen Kumar Dhakade</span><div><a href="https://github.com/praveendhakade">GitHub ↗</a><a href="https://www.linkedin.com/in/praveendhakade/">LinkedIn ↗</a><a href="mailto:praveendhakade@gmail.com">Email ↗</a></div></footer></body></html>;
}
