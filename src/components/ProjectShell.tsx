"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchProject } from "@/lib/api";
import { BankSidebar } from "./BankSidebar";
import { SnippetList } from "./SnippetList";

/**
 * The Project shell (spec §6.4). Lands the user in the piece with its snippets
 * in a persistent bank. The three modes (Filter / Architect / Editor) fill the
 * main area in Phase 6; for now it shows the pulled-in material.
 */
export function ProjectShell({ id }: { id: string }) {
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="py-16 text-center text-sm text-faint">Opening…</p>
      </main>
    );
  }

  if (isError || !project) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="py-16 text-center text-sm text-faint">
          This piece could not be found.{" "}
          <Link href="/" className="underline">
            Back to Scratch
          </Link>
        </p>
      </main>
    );
  }

  const included = project.snippets
    .filter((s) => s.included)
    .map((s) => s.snippet);

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl flex-1 px-6 py-10"
    >
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs text-faint transition-colors hover:text-foreground"
        >
          ← Scratch
        </Link>
        <div className="mt-4 text-[11px] uppercase tracking-wider text-faint">
          The piece
        </div>
        <h1 className="mt-1 max-w-2xl text-2xl leading-snug text-foreground">
          {project.throughline.phrase}
        </h1>
      </header>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        <section className="min-w-0 flex-1">
          <h2 className="mb-4 text-[11px] uppercase tracking-wider text-faint">
            The material you pulled in
          </h2>
          <SnippetList snippets={included} />
          <p className="mt-8 text-sm text-faint">
            Ways to shape this — filter, architect, edit — are coming next.
          </p>
        </section>

        <BankSidebar snippets={project.snippets} />
      </div>
    </motion.main>
  );
}
