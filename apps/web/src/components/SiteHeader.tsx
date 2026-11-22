import { Link } from "@tanstack/react-router";
import { external, site } from "~/lib/site";
import { LogoMark } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark />
          {site.name}
        </Link>
        <nav className="flex items-center gap-5 text-[13px] text-muted">
          <Link
            to="/docs"
            className="transition-colors hover:text-ink"
            activeProps={{ className: "text-ink" }}
          >
            Docs
          </Link>
          <a
            href={site.changelog}
            {...external}
            className="hidden transition-colors hover:text-ink sm:inline"
          >
            Changelog
          </a>
          <a href={site.repo} {...external} className="transition-colors hover:text-ink">
            GitHub
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[13px]">
          <a
            href={site.npm}
            {...external}
            className="hidden rounded-md border border-line-strong px-2 py-1 font-mono text-xs text-muted transition-colors hover:text-ink sm:inline"
          >
            v{site.version}
          </a>
          <Link
            to="/docs"
            className="rounded-md bg-ink px-3 py-1.5 font-medium text-bg transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
