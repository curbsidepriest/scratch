"use client";

import type { ProjectSnippetDTO } from "@/lib/types";

function excerpt(text: string, max = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

/**
 * The persistent snippet bank (spec §6.4/§8a). Shows every snippet shared into
 * the project. Benched snippets ("move to bank") stay here — nothing is
 * destroyed; they may start the next piece.
 */
export function BankSidebar({ snippets }: { snippets: ProjectSnippetDTO[] }) {
  const included = snippets.filter((s) => s.included);
  const benched = snippets.filter((s) => !s.included);

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className="sticky top-10">
        <h2 className="mb-3 text-[11px] uppercase tracking-wider text-faint">
          Bank · {snippets.length}
        </h2>
        <ul className="flex flex-col gap-1.5">
          {included.map((ps) => (
            <li
              key={ps.snippet.id}
              className="rounded-md border border-border bg-surface px-3 py-2 text-xs leading-snug text-muted"
            >
              {excerpt(ps.snippet.content)}
            </li>
          ))}
        </ul>

        {benched.length > 0 && (
          <>
            <h3 className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-faint">
              Benched · {benched.length}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {benched.map((ps) => (
                <li
                  key={ps.snippet.id}
                  className="rounded-md border border-dashed border-border px-3 py-2 text-xs leading-snug text-faint"
                >
                  {excerpt(ps.snippet.content)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
