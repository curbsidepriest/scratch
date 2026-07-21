import { ProjectShell } from "@/components/ProjectShell";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectShell id={id} />;
}
