import { Link } from "@tanstack/react-router";
import { external, site } from "~/lib/site";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-faint">
        <p className="flex items-center gap-2">
          <LogoMark className="size-3.5" />
          {site.name} is MIT licensed.
        </p>
        <div className="flex gap-5">
          <Link to="/docs" className="hover:text-ink">
            Docs
          </Link>
          <a href={site.changelog} {...external} className="hover:text-ink">
            Changelog
          </a>
          <a href={site.repo} {...external} className="hover:text-ink">
            GitHub
          </a>
          <a href={site.npm} {...external} className="hover:text-ink">
            npm
          </a>
        </div>
      </div>
    </footer>
  );
}
