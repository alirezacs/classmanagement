"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="en"><body><main style={{ display: "grid", minHeight: "100vh", placeItems: "center", fontFamily: "sans-serif" }}><div style={{ textAlign: "center" }}><h1>Application unavailable</h1><p>Please try again shortly.</p><button type="button" onClick={reset}>Try again</button></div></main></body></html>; }

