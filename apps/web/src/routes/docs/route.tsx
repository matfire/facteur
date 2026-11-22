import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { docPath, docSections } from "~/lib/docs";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  const menu = useRef<HTMLDetailsElement>(null);
  const { pathname } = useLocation();

  // Close the mobile menu after navigating.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <div className="mx-auto flex max-w-6xl px-5">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-line py-10 pr-6 md:block">
        <DocsNav />
      </aside>
      <div className="min-w-0 flex-1 md:pl-12">
        <details ref={menu} className="group mt-6 rounded-lg border border-line bg-panel md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-soft">
            Menu
            <span className="text-faint transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-line px-3 py-4">
            <DocsNav />
          </div>
        </details>
        <Outlet />
      </div>
    </div>
  );
}

function DocsNav() {
  return (
    <nav className="space-y-7">
      {docSections.map((section) => (
        <div key={section.name}>
          <p className="mb-2 px-2.5 text-[11px] font-medium tracking-wider text-faint uppercase">
            {section.name}
          </p>
          <ul className="space-y-px">
            {section.docs.map((doc) => (
              <li key={doc.slug}>
                <Link
                  to={docPath(doc)}
                  activeOptions={{ exact: true }}
                  className="block rounded-md px-2.5 py-1.5 text-[13.5px] text-muted transition-colors hover:text-ink"
                  activeProps={{ className: "bg-white/[0.06] !text-ink" }}
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
