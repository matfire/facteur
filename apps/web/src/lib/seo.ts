import { site } from "./site";

/** Absolute URL for a site path. Only the home page keeps its trailing slash, matching the sitemap. */
export function absoluteUrl(path: string) {
  const url = new URL(path, site.url).toString();
  return path === "/" ? url : url.replace(/\/$/, "");
}

type SeoInput = {
  title: string;
  description: string;
  /** Site-relative path of the page, used for the canonical URL. */
  path: string;
  type?: "website" | "article";
  /** JSON-LD objects for this page. */
  jsonLd?: Array<Record<string, unknown>>;
};

const ogImage = {
  url: absoluteUrl("/og.png"),
  width: "1200",
  height: "630",
  alt: "Facteur: one email client for Resend, Amazon SES and SMTP",
};

/**
 * Title, description, canonical URL, Open Graph, Twitter card and JSON-LD for a page.
 * Spread the result into a route's `head`. Meta tags dedupe by name/property, so a
 * child route's values replace the root's.
 */
export function seo({ title, description, path, type = "website", jsonLd = [] }: SeoInput) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: type },
      { property: "og:site_name", content: site.name },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: ogImage.url },
      { property: "og:image:width", content: ogImage.width },
      { property: "og:image:height", content: ogImage.height },
      { property: "og:image:alt", content: ogImage.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage.url },
      { name: "twitter:image:alt", content: ogImage.alt },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd.map((data) => ({
      type: "application/ld+json",
      // Escape "<" so no string in the data can close the script tag.
      children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
        /</g,
        "\\u003c",
      ),
    })),
  };
}

export const softwareJsonLd = {
  "@type": "SoftwareSourceCode",
  name: site.name,
  alternateName: site.packageName,
  description: site.description,
  url: site.url,
  codeRepository: site.repo,
  programmingLanguage: "TypeScript",
  runtimePlatform: "Node.js",
  license: `https://opensource.org/licenses/${site.license}`,
  version: site.version,
  author: { "@type": "Person", name: site.author.name, url: site.author.url },
};

export const websiteJsonLd = {
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
};
