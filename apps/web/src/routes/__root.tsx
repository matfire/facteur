/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NotFound } from "~/components/NotFound";
import { SiteHeader } from "~/components/SiteHeader";
import { site } from "~/lib/site";
import appCss from "~/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: site.title },
      { name: "description", content: site.description },
      { name: "theme-color", content: "#08090a" },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RouterNotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <SiteHeader />
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * The router's fallback for missing URLs, rendered after Cloudflare's 404.html
 * hydrates and on client-side navigation to a missing page. Route heads don't
 * apply here, so React hoists this title and noindex into <head> instead.
 */
function RouterNotFound() {
  return (
    <>
      <title>{`Page not found · ${site.name}`}</title>
      <meta name="robots" content="noindex" />
      <NotFound />
    </>
  );
}
