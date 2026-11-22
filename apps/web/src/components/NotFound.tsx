import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="font-mono text-sm text-accent-ink">404</p>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-tight">Return to sender</h1>
      <p className="mt-4 text-muted">This page doesn't exist.</p>
      <Link to="/" className="mt-8 inline-block text-sm text-soft hover:text-ink">
        ← Back home
      </Link>
    </main>
  );
}
