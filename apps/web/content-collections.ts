import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";
import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const markdownOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
    [rehypeShiki, { theme: "github-dark-default" }],
  ],
} satisfies Parameters<typeof compileMarkdown>[2];

/** The `##` headings of a markdown document, with the ids rehype-slug gives them. */
function headings(markdown: string) {
  const slugger = new GithubSlugger();
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.slice(3).trim().replace(/`/g, "");
      return { text, id: slugger.slug(text) };
    });
}

const docs = defineCollection({
  name: "docs",
  directory: "content/docs",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(["Getting started", "Guides"]),
    order: z.number(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const html = await compileMarkdown(context, document, markdownOptions);
    return {
      title: document.title,
      description: document.description,
      section: document.section,
      order: document.order,
      slug: document._meta.path,
      headings: headings(document.content),
      markdown: document.content,
      html,
    };
  },
});

/** Highlighted code samples used on the landing page. */
const snippets = defineCollection({
  name: "snippets",
  directory: "content/snippets",
  include: "*.md",
  schema: z.object({ content: z.string() }),
  transform: async (document, context) => ({
    name: document._meta.path,
    html: await compileMarkdown(context, document, markdownOptions),
  }),
});

export default defineConfig({
  content: [docs, snippets],
});
