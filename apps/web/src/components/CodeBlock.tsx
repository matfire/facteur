export function CodeBlock({ html, className = "" }: { html: string; className?: string }) {
  // html is compiled from our own markdown at build time by content-collections.
  return <div className={`code-block ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
