import type { Metadata } from "next";
import { profile } from "@/data/portfolio";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage() { return <section className="container"><p className="eyebrow">Contact</p><h1>Start a conversation.</h1><p className="lede">For professional inquiries, you can reach me through email or my public profiles.</p><div className="actions"><a className="button primary" href={`mailto:${profile.email}`}>Email Praveen ↗</a><a className="button" href={profile.linkedin}>LinkedIn ↗</a><a className="button" href={profile.github}>GitHub ↗</a></div><p className="muted" style={{marginTop:"2rem"}}>Email link opens your mail app. This site does not claim to deliver or store messages.</p></section>; }
