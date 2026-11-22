import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "~/components/NotFound";
import { site } from "~/lib/site";

// Pre-rendered to 404.html, which Cloudflare serves for any missing URL.
export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [{ title: `Page not found · ${site.name}` }, { name: "robots", content: "noindex" }],
  }),
  component: NotFound,
});
