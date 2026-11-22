import { allDocs } from "content-collections";

export type Doc = (typeof allDocs)[number];

/** Docs in reading order. `index.md` is the docs home at /docs. */
export const docs: Array<Doc> = allDocs.toSorted((a, b) => a.order - b.order);

/** Docs grouped by section, sections in the order they first appear. */
export const docSections = docs.reduce<Array<{ name: Doc["section"]; docs: Array<Doc> }>>(
  (sections, doc) => {
    const section = sections.find((s) => s.name === doc.section);
    if (section) section.docs.push(doc);
    else sections.push({ name: doc.section, docs: [doc] });
    return sections;
  },
  [],
);

export function findDoc(slug: string): Doc | undefined {
  return docs.find((doc) => doc.slug === (slug.replace(/\/$/, "") || "index"));
}

export function docPath(doc: Doc) {
  return doc.slug === "index" ? "/docs" : `/docs/${doc.slug}`;
}
