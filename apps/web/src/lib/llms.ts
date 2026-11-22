import { docPath, docSections, docs } from "./docs";
import { absoluteUrl } from "./seo";
import { site } from "./site";

/** Text responses for /llms.txt and /llms-full.txt (https://llmstxt.org). */
export function textResponse(body: string) {
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

export function llmsIndex() {
  const sections = docSections.map(
    (section) =>
      `## ${section.name}\n\n${section.docs
        .map((doc) => `- [${doc.title}](${absoluteUrl(docPath(doc))}): ${doc.description}`)
        .join("\n")}`,
  );
  return (
    [
      `# ${site.name}`,
      `> ${site.description}`,
      `Install with \`npm install ${site.packageName}\` plus the SDK of your provider. The full documentation as one file is at ${absoluteUrl("/llms-full.txt")}.`,
      ...sections,
      `## Optional\n\n- [Source code](${site.repo})\n- [Changelog](${site.changelog})\n- [npm package](${site.npm})`,
    ].join("\n\n") + "\n"
  );
}

export function llmsFull() {
  return (
    [
      `# ${site.name}\n\n> ${site.description}`,
      ...docs.map(
        (doc) => `# ${doc.title}\n\nSource: ${absoluteUrl(docPath(doc))}\n\n${doc.markdown.trim()}`,
      ),
    ].join("\n\n---\n\n") + "\n"
  );
}
