import Link from "next/link";
export default function NotFound() { return <section className="container"><p className="eyebrow">404 · Not found</p><h1>This page isn’t here.</h1><p className="lede">The link may have moved. Head back to the portfolio to find your way.</p><Link className="button primary" href="/">Return home</Link></section>; }
