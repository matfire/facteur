import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { docPath, docs, type Doc } from "~/lib/docs";
import { absoluteUrl, seo } from "~/lib/seo";
import { site } from "~/lib/site";

export function docHead(doc: Doc) {
  const path = docPath(doc);
  const isHome = doc.slug === "index";
  return seo({
    title: isHome ? `${site.name} documentation` : `${doc.title} · ${site.name} docs`,
    description: doc.description,
    path,
    type: "article",
    jsonLd: [
      {
        "@type": "TechArticle",
        headline: doc.title,
        description: doc.description,
        url: absoluteUrl(path),
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        about: { "@type": "SoftwareSourceCode", name: site.name, codeRepository: site.repo },
        author: { "@type": "Person", name: site.author.name, url: site.author.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: site.name, path: "/" },
          { name: "Docs", path: "/docs" },
          ...(isHome ? [] : [{ name: doc.title, path }]),
        ].map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.name,
          item: absoluteUrl(crumb.path),
        })),
      },
    ],
  });
}

export function DocPage({ doc }: { doc: Doc }) {
  // Match by slug: after hydration, `doc` is a copy, not the object in `docs`.
  const index = docs.findIndex((d) => d.slug === doc.slug);
  const previous = docs[index - 1];
  const next = docs[index + 1];

  return (
    <div className="flex gap-12 pt-10 pb-20 md:pt-14">
      <article className="min-w-0 flex-1">
        <header className="mb-10">
          <p className="text-[13px] text-faint">{doc.section}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{doc.title}</h1>
          <p className="mt-3 text-lg text-muted">{doc.description}</p>
        </header>
        {/* Compiled from our own markdown at build time. */}
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: doc.html }} />
        <footer className="mt-16 grid gap-3 sm:grid-cols-2">
          {previous ? <PagerLink doc={previous} label="Previous" /> : <span />}
          {next && <PagerLink doc={next} label="Next" align="right" />}
        </footer>
      </article>
      {doc.headings.length > 0 && <Toc headings={doc.headings} />}
    </div>
  );
}

function PagerLink({
  doc,
  label,
  align = "left",
}: {
  doc: Doc;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <Link
      to={docPath(doc)}
      className={`rounded-lg border border-line px-4 py-3 transition-colors hover:border-line-strong hover:bg-white/[0.02] ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <span className="text-xs text-faint">{label}</span>
      <span className="mt-0.5 block text-sm font-medium">{doc.title}</span>
    </Link>
  );
}

/** "On this page", highlighting the section currently in view. */
function Toc({ headings }: { headings: Doc["headings"] }) {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    // The active section is the last heading scrolled past the sticky header,
    // or the first heading when none has been. At the bottom of the page the last
    // section is active, since a short final section can't reach the top.
    const update = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const passed = elements.filter((el) => el.getBoundingClientRect().top <= 120);
      setActive((atBottom ? elements.at(-1) : (passed.at(-1) ?? elements[0]))?.id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [headings]);

  return (
    <aside className="sticky top-24 hidden h-fit w-44 shrink-0 lg:block">
      <p className="mb-3 text-[11px] font-medium tracking-wider text-faint uppercase">
        On this page
      </p>
      <ul className="space-y-2 text-[13px]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`transition-colors hover:text-ink ${heading.id === active ? "text-ink" : "text-faint"}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
