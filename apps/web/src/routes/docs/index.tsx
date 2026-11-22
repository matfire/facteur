import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocPage, docHead } from "~/components/DocPage";
import { findDoc } from "~/lib/docs";

export const Route = createFileRoute("/docs/")({
  loader: () => {
    const doc = findDoc("index");
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => (loaderData ? docHead(loaderData) : {}),
  component: () => <DocPage doc={Route.useLoaderData()} />,
});
